import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tickets, orders } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const short = url.searchParams.get('short')

    if (!token && !short) {
      return NextResponse.json({ error: 'missing token or short' }, { status: 400 })
    }

  // `eq` expects a non-null string; narrow the values first
  const where = token ? eq(tickets.entryToken, String(token)) : eq(tickets.shortCode, String(short))

    const rows = await db
      .select({
        id: tickets.id,
        entryToken: tickets.entryToken,
        shortCode: tickets.shortCode,
        status: tickets.status,
        issuedAt: tickets.issuedAt,
        checkedInAt: tickets.checkedInAt,
        ticketType: tickets.ticketType,
        buyerName: tickets.buyerName,
        orderId: tickets.orderId,
      })
      .from(tickets)
      .where(where)

    if (rows.length === 0) return NextResponse.json({ error: 'ticket not found' }, { status: 404 })

    const t = rows[0]

    const orderRow = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.id, t.orderId))

    const order = orderRow[0] || null

    return NextResponse.json({ ticket: t, order })
  } catch (err) {
    console.error('ticket.info error', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
