import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, orders, tickets, payments } from '@/lib/schema'
import { eq } from 'drizzle-orm'

type SeedRequest = {
  clerkUserId: string
  email: string
  fullName?: string
  whatsappE164?: string
  amount?: number
  // when true, create a payment row (PENDING) with providerRef and invoiceUrl to simulate an invoice
  withPayment?: boolean
  providerRef?: string
  invoiceUrl?: string
}

export async function POST(req: Request) {
  try {
    const body: SeedRequest = await req.json()
    const { clerkUserId, email, fullName, whatsappE164, amount = 100000 } = body

    if (!clerkUserId || !email) {
      return NextResponse.json({ error: 'clerkUserId and email are required' }, { status: 400 })
    }

    // Upsert user: if exists, use existing, otherwise insert
    const existing = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId))
    let userId: string

    if (existing.length > 0) {
      userId = existing[0].id
    } else {
      const res = await db.insert(users).values({ clerkUserId, email, fullName: fullName ?? null, whatsappE164: whatsappE164 ?? null }).returning()
      userId = res[0].id
    }

    // Create an order (left in PENDING so it's buyable)
  const orderRes = (await db.insert(orders).values({ userId, amount }).returning()) as { id: string }[]
  const order = orderRes[0]

    // Optionally create a payment (PENDING) to simulate an invoice
    let payment: unknown | null = null
    if (body.withPayment) {
      const prov = body.providerRef || `inv_${Math.random().toString(36).slice(2, 10)}`
      const invoice = body.invoiceUrl || `https://example.com/invoice/${prov}`
  const payRes = (await db.insert(payments).values({ orderId: order.id, providerRef: prov, invoiceUrl: invoice, amount }).returning()) as { id: string }[]
  payment = payRes[0] || null
    }

    // Create a ticket linked to the order and user
    const token = `ticket_${Math.random().toString(36).slice(2, 10)}`
    const shortCode = Math.random().toString(36).slice(2, 10)
  const ticketRes = (await db.insert(tickets).values({ orderId: order.id, userId, entryToken: token, shortCode, issuedBy: 'seed' }).returning()) as { id: string }[]
  const ticket = ticketRes[0] || null

    return NextResponse.json({ ok: true, userId, order, payment, ticket })
  } catch (err) {
    console.error('seed error', err)
    const e = err as Error | undefined
    return NextResponse.json({ error: e?.message || 'Unknown' }, { status: 500 })
  }
}
