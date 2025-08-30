/*
Mocked test harness for order creation + xendit webhook flows.
This script does NOT import your TypeScript route files; instead it re-implements
the same high-level logic in plain JS with a fake in-memory DB and mocked fetch.

Run: node scripts/test-mocked-order-webhook.js
*/

// Minimal in-memory DB supporting the operations used by the routes
const makeFakeDb = () => {
  const users = []
  const orders = []
  const payments = []
  const tickets = []

  return {
    users,
    orders,
    payments,
    tickets,
    async selectFrom(table, whereFn) {
      const data = { users, orders, payments, tickets }[table]
      return data.filter(whereFn)
    },
    async insert(table, row) {
      const data = { users, orders, payments, tickets }[table]
      const id = `${table.slice(0, 1)}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
      const newRow = { id, ...row }
      data.push(newRow)
      return newRow
    },
    async update(table, predicateFn, changes) {
      const data = { users, orders, payments, tickets }[table]
      let count = 0
      for (let r of data) {
        if (predicateFn(r)) {
          Object.assign(r, changes)
          count++
        }
      }
      return count
    },
    // simple transaction wrapper
    async transaction(fn) {
      // For the fake DB, we just call the function directly.
      return await fn({
        select: async (tbl) => {
          return { users, orders, payments, tickets }[tbl]
        },
      })
    }
  }
}

// Mock fetch to Xendit: returns success invoice payload
const mockFetchCreateInvoice = async ({ external_id, amount, payer_email, description }) => {
  // simulate a returned invoice from Xendit
  return {
    ok: true,
    json: async () => ({ id: `inv_${Math.random().toString(36).slice(2,8)}`, invoice_url: `https://pay.example/${external_id}` }),
    text: async () => JSON.stringify({ error: 'none' }),
    status: 200
  }
}

// Re-implement create-order logic (simplified) using fake db and mock fetch
async function createOrder({ db, queryString, email, fullName, clerkUserId }) {
  const params = new URLSearchParams(queryString)
  const quantities = {}
  for (const [k, v] of params.entries()) {
    const n = Number(v || 0)
    if (!isNaN(n) && n > 0) quantities[k] = n
  }
  if (Object.keys(quantities).length === 0) throw new Error('no tickets selected')

  // user
  let userId
  if (clerkUserId) {
    const existing = db.users.find(u => u.clerkUserId === clerkUserId)
    if (existing) userId = existing.id
    else {
      const created = await db.insert('users', { clerkUserId, email: email || `${clerkUserId}@example.local`, fullName: fullName ?? null })
      userId = created.id
    }
  } else {
    const anonId = `anon_${Date.now()}`
    const created = await db.insert('users', { clerkUserId: anonId, email: email || `guest+${Date.now()}@example.local`, fullName: fullName ?? null })
    userId = created.id
  }

  const PRICES = { reguler: 150000, vip: 300000, early: 100000 }
  let amount = 0
  for (const [k, q] of Object.entries(quantities)) amount += (PRICES[k] || 0) * q

  const order = await db.insert('orders', { userId, amount, status: 'PENDING' })
  const payment = await db.insert('payments', { orderId: order.id, providerRef: '', invoiceUrl: '', amount, payload: { quantities }, status: 'PENDING' })

  // call mocked Xendit
  const external_id = `order_${order.id}`
  const resp = await mockFetchCreateInvoice({ external_id, amount, payer_email: email, description: `Order ${order.id}` })
  if (!resp.ok) throw new Error('xendit failed')
  const json = await resp.json()
  const invoiceId = json.id || ''
  const invoiceUrl = json.invoice_url || ''

  await db.update('payments', (r) => r.id === payment.id, { providerRef: invoiceId, invoiceUrl })

  return { order, paymentId: payment.id, invoiceId, invoiceUrl }
}

// Re-implement webhook handling (simplified) that uses payment.payload.quantities
async function handleInvoicePaid({ db, invoiceExternalId, invoiceId }) {
  // derive orderId
  const match = invoiceExternalId.match(/^order_(.+)$/)
  if (!match) return { ok: true, reason: 'no-match' }
  const orderId = match[1]

  // find payment
  const payment = db.payments.find(p => p.orderId === orderId)
  if (!payment) return { ok: true, reason: 'no-payment' }
  if (payment.status === 'PAID') return { ok: true, reason: 'already-paid' }
  if (payment.providerRef && invoiceId && payment.providerRef !== invoiceId) return { ok: true, reason: 'provider-mismatch' }

  // mark paid
  await db.update('payments', (r) => r.id === payment.id, { status: 'PAID', providerRef: invoiceId })
  await db.update('orders', (r) => r.id === orderId, { status: 'PAID', paidAt: new Date().toISOString() })

  // check existing tickets
  const existing = db.tickets.filter(t => t.orderId === orderId)
  if (existing.length > 0) return { ok: true, reason: 'tickets-exist' }

  const payload = payment.payload || {}
  const quantities = payload.quantities || {}
  const created = []
  for (const [k, q] of Object.entries(quantities)) {
    const n = Number(q) || 0
    for (let i = 0; i < n; i++) {
      const ticket = await db.insert('tickets', { orderId, userId: payment.userId || null, entryToken: `ticket_${Math.random().toString(36).slice(2,10)}`, shortCode: Math.random().toString(36).slice(2,8), issuedAt: new Date().toISOString() })
      created.push(ticket)
    }
  }

  return { ok: true, created }
}

async function runTests() {
  const db = makeFakeDb()
  console.log('--- Test: createOrder with reguler=2&vip=1 ---')
  const { order, paymentId, invoiceId, invoiceUrl } = await createOrder({ db, queryString: 'reguler=2&vip=1', email: 'buyer@example.test' })
  console.log('order created:', order.id)
  console.log('paymentId:', paymentId)
  console.log('invoiceId:', invoiceId)
  console.log('invoiceUrl:', invoiceUrl)

  console.log('\n--- Test: webhook processing (invoice paid) ---')
  const invoiceExternalId = `order_${order.id}`
  const webhookRes = await handleInvoicePaid({ db, invoiceExternalId, invoiceId })
  console.log('webhook result:', webhookRes)
  console.log('tickets in db:', db.tickets.length)

  console.log('\n--- Test: idempotency - send same webhook again ---')
  const webhookRes2 = await handleInvoicePaid({ db, invoiceExternalId, invoiceId })
  console.log('webhook result 2:', webhookRes2)
  console.log('tickets in db after duplicate:', db.tickets.length)

  console.log('\n--- Test: providerRef mismatch ---')
  // create another order
  const { order: order2 } = await createOrder({ db, queryString: 'early=1', email: 'alice@example.test' })
  // simulate webhook with different invoiceId than stored in payment
  const payment2 = db.payments.find(p => p.orderId === order2.id)
  // set providerRef to some value
  await db.update('payments', r => r.id === payment2.id, { providerRef: 'inv_stored' })
  const webhookRes3 = await handleInvoicePaid({ db, invoiceExternalId: `order_${order2.id}`, invoiceId: 'inv_other' })
  console.log('provider-mismatch case:', webhookRes3)
}

runTests().catch(err => { console.error('test error', err); process.exit(1) })
