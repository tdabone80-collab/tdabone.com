import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, orders, payments } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getAuth } from '@clerk/nextjs/server'
import { ensureClerkUserSynced } from '@/lib/syncClerk'

type CreateRequest = {
  // a query string containing ticket quantities (e.g. 'reguler=2&vip=1')
  query: string
  // optional payer info
  email?: string
  fullName?: string
  clerkUserId?: string
}

export async function POST(req: Request) {
  try {
    const body: CreateRequest = await req.json()
    const { query, email = '', fullName, clerkUserId: bodyClerkUserId } = body

    // Prefer the authenticated Clerk user if present. This ensures orders are
    // associated with the currently-logged-in user instead of an external id
    // passed from the client. If a Clerk user is present, ensure we sync the
    // Clerk profile into our local `users` table before continuing.
    let effectiveClerkUserId: string | undefined = bodyClerkUserId
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { userId: authUserId } = getAuth(req as any)
      if (authUserId) {
        effectiveClerkUserId = authUserId
        try {
          // upsert Clerk user into our local DB (best-effort)
          await ensureClerkUserSynced(authUserId)
        } catch (syncErr) {
          console.warn('ensureClerkUserSynced failed', syncErr)
        }
      }
    } catch {
      // getAuth may throw in non-Next contexts; ignore and proceed with body value
    }

    if (!query) return NextResponse.json({ error: 'missing query' }, { status: 400 })

    const params = new URLSearchParams(query)

    // Resolve quantities against known ticket types
    const quantities: Record<string, number> = {}
    for (const [k, v] of params.entries()) {
      const n = Number(v || 0)
      if (!isNaN(n) && n > 0) quantities[k] = n
    }

    if (Object.keys(quantities).length === 0) return NextResponse.json({ error: 'no tickets selected' }, { status: 400 })

    // Ensure a user row exists. orders.userId is NOT NULL in the schema,
    // so create or reuse a user. If no clerkUserId was provided we create an
    // anonymous user with a generated clerk id and unique guest email.
    let userId: string
    if (effectiveClerkUserId) {
      const existing = await db.select().from(users).where(eq(users.clerkUserId, effectiveClerkUserId))
      if (existing.length > 0) {
        userId = existing[0].id
      } else {
        const res = (await db.insert(users).values({ clerkUserId: effectiveClerkUserId, email: email || `${effectiveClerkUserId}@example.local`, fullName: fullName ?? null }).returning()) as { id: string }[]
        userId = res[0].id
      }
    } else {
      const anonId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const anonEmail = email || `guest+${Date.now()}@example.local`
      const res = (await db.insert(users).values({ clerkUserId: anonId, email: anonEmail, fullName: fullName ?? null }).returning()) as { id: string }[]
      userId = res[0].id
    }

    // compute amount based on ticket prices known to the app
    const PRICES: Record<string, number> = { reguler: 150_000, vip: 300_000, early: 100_000 }
    let amount = 0
    for (const [k, q] of Object.entries(quantities)) {
      amount += (PRICES[k] || 0) * q
    }

  // Create order (PENDING)
  const orderRes = (await db.insert(orders).values({ userId, amount }).returning()) as { id: string }[]
  const order = orderRes[0]

  // Build metadata for invoice + to persist with payment so webhook can recreate tickets
  const metadata = {
    orderId: order.id,
    userId,
    clerkUserId: effectiveClerkUserId ?? null,
    email: email || null,
    fullName: fullName ?? null,
    quantities,
  }

  // Create a payment row in PENDING to be filled after invoice creation
  const paymentRes = (await db.insert(payments).values({ orderId: order.id, providerRef: '', invoiceUrl: '', amount, payload: { quantities, metadata } }).returning()) as { id: string }[]
  const payment = paymentRes[0]

    // Create Xendit invoice
    const key = process.env.XENDIT_API_KEY
    if (!key) {
      return NextResponse.json({ error: 'XENDIT_API_KEY not configured' }, { status: 500 })
    }

    const external_id = `order_${order.id}`

    // Build an itemized list for the invoice so the payment provider and
    // payer see clear product details. Also include metadata with customer
    // and cart information for reconciliation in webhooks/console.
    const items = Object.entries(quantities).map(([key, qty]) => ({
      name: key,
      quantity: qty,
      price: PRICES[key] || 0,
    }))

    

    // Provide a success redirect. If the env var isn't set, fall back to a
    // predictable local success page on the app. Consumers should set
    // XENDIT_SUCCESS_REDIRECT in production to a hosted route.
    const fallbackRedirect = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/order/success?orderId=${order.id}`
    const successRedirect = fallbackRedirect

    const payload = {
      external_id,
      amount,
      payer_email: email || undefined,
      description: `Order ${order.id} - ${items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`,
      success_redirect_url: successRedirect,
      // Xendit accepts `items` and `metadata` and will surface them in the
      // invoice details; include both for clarity and reconciliation.
      items,
      metadata,
    }

    const basic = Buffer.from(`${key}:`).toString('base64')
    const resp = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      const text = await resp.text()
      console.error('xendit create invoice failed', resp.status, text)
      return NextResponse.json({ error: 'Failed to create invoice', detail: text }, { status: 502 })
    }

    const json = await resp.json()
    const invoiceId = json.id || json.invoice_id || json.external_id || ''
    const invoiceUrl = json.invoice_url || json.url || json.invoice_url || ''

    // update payment row with providerRef and invoiceUrl
    await db.update(payments).set({ providerRef: invoiceId, invoiceUrl }).where(eq(payments.id, payment.id))

    return NextResponse.json({ ok: true, orderId: order.id, paymentId: payment.id, invoiceId, invoiceUrl })
  } catch (err) {
    console.error('create order error', err)
    const e = err as Error | undefined
    return NextResponse.json({ error: e?.message || 'Unknown' }, { status: 500 })
  }
}
