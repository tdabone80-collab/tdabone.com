/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users, tickets } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { userId } = getAuth(req as any)
    if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    // find local user row
    const urows = await db.select().from(users).where(eq(users.clerkUserId, userId))
    if (!urows || urows.length === 0) return NextResponse.json({ tickets: [] })
    const u = urows[0]

  const ticketRows = await db.select({
      id: tickets.id,
      entryToken: tickets.entryToken,
      shortCode: tickets.shortCode,
      issuedAt: tickets.issuedAt,
      checkedInAt: tickets.checkedInAt,
      status: tickets.status,
      ticketType: tickets.ticketType,
      buyerName: tickets.buyerName,
  }).from(tickets).where(eq(tickets.userId, u.id)).orderBy(tickets.issuedAt)

    return NextResponse.json({ tickets: ticketRows })
  } catch (err) {
    console.error('GET /api/my/tickets error', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
