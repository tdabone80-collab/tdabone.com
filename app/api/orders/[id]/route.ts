import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, tickets } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Next.js may provide params as a thenable; await it before use per docs
    // https://nextjs.org/docs/messages/sync-dynamic-apis
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolvedParams = await (params as any)
    const id = resolvedParams.id
    const orderRows = await db.select().from(orders).where(eq(orders.id, id))
    if (orderRows.length === 0) return NextResponse.json({ error: 'order not found' }, { status: 404 })
    const order = orderRows[0]
  // select explicit columns to avoid errors if `issued_by` isn't yet present in DB
  const ticketRows = await db.select({ id: tickets.id, entryToken: tickets.entryToken, shortCode: tickets.shortCode, issuedAt: tickets.issuedAt, checkedInAt: tickets.checkedInAt, status: tickets.status }).from(tickets).where(eq(tickets.orderId, id))
  // Return tickets directly; QR generation is performed client-side to
  // avoid server-side dependency and bundling issues.
  return NextResponse.json({ order, tickets: ticketRows })
  } catch (err) {
    console.error('orders.get error', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
