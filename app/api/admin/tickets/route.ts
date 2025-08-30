/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tickets, orders } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { getAuth, clerkClient } from '@clerk/nextjs/server'

export async function GET(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userId } = getAuth(req as any)
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const whitelistRaw = process.env.ADMIN_WHITELIST || ''
    const whitelist = whitelistRaw.split(',').map(s => s.trim()).filter(Boolean)
    if (whitelist.length > 0) {
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      const primary = (user as unknown as Record<string, unknown>).primaryEmailAddress as Record<string, unknown> | undefined
      const emails = (user as unknown as Record<string, unknown>).emailAddresses as Array<Record<string, unknown>> | undefined
      const email = (primary && String(primary.emailAddress)) || (emails && emails[0] && String(emails[0].emailAddress)) || ''
      if (!whitelist.includes(email)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const q = url.searchParams.get('q') || ''
    const status = url.searchParams.get('status') || ''

    // basic filtering: search by shortCode, entryToken, or orderId
    let whereClause = sql`1=1`
    if (q) {
      const like = `%${q}%`
      whereClause = sql`${sql.raw(whereClause.toString())} AND ( ${tickets.shortCode}::text ILIKE ${like} OR ${tickets.entryToken}::text ILIKE ${like} OR ${tickets.orderId}::text ILIKE ${like} )`
    }
    if (status) {
      whereClause = sql`${sql.raw(whereClause.toString())} AND ${tickets.status} = ${status}`
    }

  let rows: any[] = []
  try {
    rows = await db.select({
      id: tickets.id,
      shortCode: tickets.shortCode,
      entryToken: tickets.entryToken,
      buyerName: tickets.buyerName,
      ticketType: tickets.ticketType,
      status: tickets.status,
      issuedAt: tickets.issuedAt,
      checkedInAt: tickets.checkedInAt,
      orderId: tickets.orderId,
      orderStatus: orders.status,
      orderCreatedAt: orders.createdAt,
    }).from(tickets).leftJoin(orders, eq(orders.id, tickets.orderId)).where(whereClause).orderBy(sql`tickets.issued_at DESC`).limit(200)
  } catch (e) {
    // Fallback for databases that haven't applied the issued_by migration yet
    console.warn('admin.tickets: fallback - issued_by column missing, querying without it', e)
    rows = await db.select({
      id: tickets.id,
      shortCode: tickets.shortCode,
      entryToken: tickets.entryToken,
      status: tickets.status,
      issuedAt: tickets.issuedAt,
      checkedInAt: tickets.checkedInAt,
      orderId: tickets.orderId,
      orderStatus: orders.status,
      orderCreatedAt: orders.createdAt,
    }).from(tickets).leftJoin(orders, eq(orders.id, tickets.orderId)).where(whereClause).orderBy(sql`tickets.issued_at DESC`).limit(200)
  }

  return NextResponse.json({ tickets: rows })
  } catch (err) {
    console.error('admin.tickets GET error', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
