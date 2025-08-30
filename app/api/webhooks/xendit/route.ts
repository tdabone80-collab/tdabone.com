import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payments, orders, tickets, users } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import crypto from 'crypto'

/**
 * Xendit will POST invoice events to this route. We expect a JSON body
 * where the event type indicates payment status. We will handle invoice
 * events by marking our payment/order as PAID and creating tickets.
 *
 * Security: if XENDIT_WEBHOOK_SECRET is set, we will verify either:
 * - x-callback-token === secret OR
 * - x-xendit-signature is HMAC-SHA256(rawBody, secret) (hex or base64)
 */
export async function POST(req: Request) {
  try {
    const raw = await req.text()

    const secret = process.env.XENDIT_WEBHOOK_SECRET
    if (secret) {
      const tokenHeader = req.headers.get('x-callback-token')
      const sigHeader = req.headers.get('x-xendit-signature')
      let verified = false
      if (tokenHeader && tokenHeader === secret) verified = true
      if (!verified && sigHeader) {
        const h = crypto.createHmac('sha256', secret).update(raw).digest()
        const hex = h.toString('hex')
        const b64 = h.toString('base64')
        if (sigHeader === hex || sigHeader === b64) verified = true
      }
      if (!verified) {
        console.error('xendit webhook: signature verification failed')
        return new Response('Invalid signature', { status: 401 })
      }
    }

    const body = raw ? JSON.parse(raw) : {}
    const invoice = body.data || body

    if (!invoice || !invoice.external_id) return NextResponse.json({ ok: true })

    const externalId: string = invoice.external_id || invoice.externalId || ''
    const match = externalId.match(/^order_(.+)$/)
    if (!match) return NextResponse.json({ ok: true })
    const orderId = match[1]

    // prefer explicit invoice id if available (Xendit returns `id`)
    const invoiceId = invoice.id || invoice.invoice_id || ''

    // Use a DB transaction so updates + ticket creation are atomic
    const result = await db.transaction(async (tx) => {
      const payRows = await tx.select().from(payments).where(eq(payments.orderId, orderId))
      if (payRows.length === 0) return { status: 'no-payment' }
      const payment = payRows[0]

      // If already PAID, nothing to do
      if (payment.status === 'PAID') return { status: 'already-paid' }

      // If providerRef is set but doesn't match incoming invoice id, log and skip
      if (payment.providerRef && invoiceId && payment.providerRef !== invoiceId) {
        console.warn('xendit webhook: providerRef mismatch', { paymentId: payment.id, expected: payment.providerRef, got: invoiceId })
        return { status: 'provider-mismatch' }
      }

    // Update payment status and providerRef (if we have invoiceId)
    await tx.update(payments).set({ status: 'PAID', providerRef: invoiceId || payment.providerRef, payload: payment.payload }).where(eq(payments.id, payment.id))

      // Update order status
      await tx.update(orders).set({ status: 'PAID', paidAt: new Date() }).where(eq(orders.id, orderId))

  // If tickets already exist for this order, skip creating them
  // Note: select explicit known columns to avoid failing when the DB
  // hasn't been migrated to include `issued_by` yet.
  const existingTickets = await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.orderId, orderId))
      if (existingTickets.length > 0) return { status: 'tickets-exist' }

      // Create tickets from payment.payload.quantities if present
      const payload = payment.payload as unknown
      let quantities: Record<string, number> = {}
      if (payload && typeof payload === 'object' && 'quantities' in (payload as Record<string, unknown>)) {
        const q = (payload as Record<string, unknown>).quantities
        if (q && typeof q === 'object') {
          quantities = Object.fromEntries(Object.entries(q).map(([k, v]) => [k, Number(v || 0)]))
        }
      }

      // Lookup order to find userId
      const orderRows = await tx.select().from(orders).where(eq(orders.id, orderId))
      const orderRow = orderRows[0]
      const userId = orderRow?.userId

      // Derive a human-friendly shortCode base from the user's identifier plus date
      let usernameBase = 'guest'
      if (userId) {
        try {
          const userRows = await tx.select().from(users).where(eq(users.id, userId))
          if (userRows.length > 0) {
            const u = userRows[0] as unknown as Record<string, unknown>
            const maybe = (u.clerkUserId as string) || (u.email as string) || (u.fullName as string) || 'guest'
            // take local part of email if present
            usernameBase = String(maybe).split('@')[0]
          }
        } catch {
          usernameBase = 'guest'
        }
      }

      // sanitize and limit length so combined shortCode <= 24
      usernameBase = String(usernameBase).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 10) || 'guest'
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
      const base = `${usernameBase}-${datePart}`

      // find existing shortCodes that start with the base to compute a numeric suffix
      const existing = await tx.select().from(tickets).where(sql`${tickets.shortCode} LIKE ${base + '%'}`)
      let startSuffix = existing.length

      // quantities map has keys like 'reguler', 'vip' — treat key as ticketType
      for (const [ticketTypeKey, qty] of Object.entries(quantities)) {
        const n = Number(qty) || 0
        for (let i = 0; i < n; i++) {
          const token = `ticket_${Math.random().toString(36).slice(2, 10)}`
          startSuffix += 1
          // construct shortCode, ensure it fits into 24 chars
          let shortCode = `${base}-${startSuffix}`
          if (shortCode.length > 24) {
            // truncate usernameBase further to make room
            const extra = shortCode.length - 24
            const newNameLen = Math.max(3, usernameBase.length - extra)
            const shortName = usernameBase.slice(0, newNameLen)
            shortCode = `${shortName}-${datePart}-${startSuffix}`.slice(0, 24)
          }

          // Attempt insert with optimistic retries in case of unique constraint collision
          let attempts = 0
          const maxAttempts = 5
          while (attempts < maxAttempts) {
            try {
              // Determine buyer name: prefer user's fullName or email, else fallback to order metadata if present
              let buyerName: string | null = null
              try {
                if (userId) {
                  const urows = await tx.select().from(users).where(eq(users.id, userId))
                  if (urows.length > 0) {
                    const uu = urows[0] as unknown as Record<string, unknown>
                    buyerName = (uu.fullName as string) || (uu.email as string) || null
                  }
                }
              } catch {
                buyerName = null
              }
              // fallback to payment.metadata or payload stored in payment
              const meta = (payment.payload as Record<string, unknown>) || {}
              if (!buyerName && meta && meta.fullName) buyerName = String(meta.fullName)

              await tx.insert(tickets).values({ orderId, userId: userId ?? orderId, entryToken: token, shortCode, issuedAt: new Date(), status: 'PAID', issuedBy: 'xendit', buyerName, ticketType: ticketTypeKey })
              break
            } catch (err) {
              attempts += 1
              // If unique violation on short_code, bump suffix and retry
              // We conservatively just increment the suffix and try again
              startSuffix += 1
              shortCode = `${usernameBase}-${datePart}-${startSuffix}`.slice(0, 24)
              if (attempts >= maxAttempts) {
                console.error('failed to insert ticket after retries', { orderId, shortCode, err })
                throw err
              }
            }
          }
        }
      }

      return { status: 'created' }
    })

    // Respond according to result (we don't expose internals to Xendit)
    if (!result || result.status === 'no-payment') return NextResponse.json({ ok: true })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('xendit webhook error', err)
    return NextResponse.json({ error: 'webhook handler error' }, { status: 500 })
  }
}
