import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tickets } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getAuth, clerkClient } from '@clerk/nextjs/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    // Require Clerk auth for scanning. getAuth expects a Next.js request-like
    // object; narrow the cast like other routes in this repo.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any)
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // If a whitelist is configured via SCAN_WHITELIST (comma-separated emails),
    // verify the authenticated user's primary email is included.
    const whitelistRaw = process.env.SCAN_WHITELIST || ''
    const whitelist = whitelistRaw.split(',').map(s => s.trim()).filter(Boolean)
    if (whitelist.length > 0) {
      const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const primary = (user as unknown as Record<string, unknown>).primaryEmailAddress as Record<string, unknown> | undefined
  const emails = (user as unknown as Record<string, unknown>).emailAddresses as Array<Record<string, unknown>> | undefined
  const email = (primary && String(primary.emailAddress)) || (emails && emails[0] && String(emails[0].emailAddress)) || ''
      if (!whitelist.includes(email)) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }
    }

  const body = await req.json()
  const { entryToken } = body as { entryToken?: string }
    if (!entryToken) return NextResponse.json({ error: 'missing entryToken' }, { status: 400 })

    const rows = await db.select().from(tickets).where(eq(tickets.entryToken, entryToken))
    if (rows.length === 0) return NextResponse.json({ error: 'ticket not found' }, { status: 404 })
    const ticket = rows[0]

    if (ticket.checkedInAt) return NextResponse.json({ error: 'already scanned', checkedInAt: ticket.checkedInAt }, { status: 409 })

    const now = new Date()
    await db.update(tickets).set({ checkedInAt: now, status: 'PAID' }).where(eq(tickets.id, ticket.id))

    // Attempt to notify an external webhook about the scan event if configured.
    try {
      const webhookUrl = process.env.SCAN_WEBHOOK_URL
      if (webhookUrl) {
        // enrich payload with ticket + actor info (attempt to look up email)
        let scannedBy = ''
        try {
          const client = await clerkClient()
          const user = await client.users.getUser(userId)
          const primary = (user as unknown as Record<string, unknown>).primaryEmailAddress as Record<string, unknown> | undefined
          const emails = (user as unknown as Record<string, unknown>).emailAddresses as Array<Record<string, unknown>> | undefined
          scannedBy = (primary && String(primary.emailAddress)) || (emails && emails[0] && String(emails[0].emailAddress)) || ''
        } catch {
          // ignore clerk lookup errors
        }

        const payload = JSON.stringify({
          ticketId: ticket.id,
          entryToken: ticket.entryToken,
          shortCode: ticket.shortCode,
          checkedInAt: now.toISOString(),
          scannedBy,
        })

        const secret = process.env.SCAN_WEBHOOK_SECRET || ''
        const signature = secret ? crypto.createHmac('sha256', secret).update(payload).digest('hex') : ''

        // fire-and-forget but await to observe failures in server logs
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(signature ? { 'x-scan-signature': signature } : {}),
          },
          body: payload,
        })
      }
    } catch (e) {
      console.error('scan webhook error', e)
    }

    return NextResponse.json({ ok: true, checkedInAt: now })
  } catch (err) {
    console.error('ticket.scan error', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
