/*
Integration test script (uses real DATABASE_URL and XENDIT_API_KEY from .env)
- Inserts a user, order, and payment into Postgres
- Calls Xendit to create an invoice for that order
- Updates the payment with the returned invoice id and URL
- Prints masked results

Run: node scripts/integration-create-order.js
*/

import('dotenv').then(dotenv => dotenv.config())
  .then(run)
  .catch(err => { console.error('dotenv load error', err); process.exit(1) })

async function run() {
  const { Pool } = await import('pg')
  const DATABASE_URL = process.env.DATABASE_URL
  const XENDIT_API_KEY = process.env.XENDIT_API_KEY
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set in environment')
    process.exit(1)
  }
  if (!XENDIT_API_KEY) {
    console.error('XENDIT_API_KEY not set in environment')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: DATABASE_URL })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Create a user
    const clerkId = `test_clerk_${Date.now()}_${Math.random().toString(36).slice(2,5)}`
    const email = `test+${Date.now()}@example.test`
    const userRes = await client.query(`INSERT INTO users (clerk_user_id, email) VALUES ($1, $2) RETURNING id`, [clerkId, email])
    const userId = userRes.rows[0].id

    // Create order
    const amount = 50000
    const orderRes = await client.query(`INSERT INTO orders (user_id, amount) VALUES ($1, $2) RETURNING id`, [userId, amount])
    const orderId = orderRes.rows[0].id

    // Create payment placeholder with unique provider_ref
    const tmpProvider = `tmp_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
    const payload = { quantities: { reguler: 1 } }
    const payRes = await client.query(`INSERT INTO payments (order_id, provider_ref, status, invoice_url, amount, payload) VALUES ($1, $2, 'PENDING', '', $3, $4) RETURNING id`, [orderId, tmpProvider, amount, payload])
    const paymentId = payRes.rows[0].id

    console.log('Inserted order and payment (ids):', { orderId, paymentId })

    // Commit the preliminary inserts so invoice creation can run without holding txn
    await client.query('COMMIT')

    // Call Xendit to create invoice
    const external_id = `order_${orderId}`
    const payloadBody = {
      external_id,
      amount,
      payer_email: email,
      description: `Test order ${orderId}`
    }

    const basic = Buffer.from(`${XENDIT_API_KEY}:`).toString('base64')
    const resp = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadBody)
    })

    const text = await resp.text()
    if (!resp.ok) {
      console.error('Xendit create invoice failed', resp.status, text)
      process.exit(1)
    }

    const json = JSON.parse(text)
    const invoiceId = json.id || json.invoice_id || ''
    const invoiceUrl = json.invoice_url || json.invoice_url || json.url || ''

    // Update payment with real invoice id and URL
    const client2 = await pool.connect()
    try {
      const upd = await client2.query(`UPDATE payments SET provider_ref = $1, invoice_url = $2 WHERE id = $3 RETURNING id, provider_ref, invoice_url`, [invoiceId, invoiceUrl, paymentId])
      const updated = upd.rows[0]
      // Mask invoice id for logs
      const masked = invoiceId ? (invoiceId.slice(0,6) + '***') : ''
      console.log('Invoice created:', { invoiceId: masked, invoiceUrl: invoiceUrl ? '(omitted)' : '' })
      console.log('Payment updated with providerRef (masked):', masked)
    } finally {
      client2.release()
    }

    console.log('Integration test succeeded. Clean up: you may want to delete test rows from DB.')

  } catch (err) {
    console.error('integration test error', err)
    try { await client.query('ROLLBACK') } catch (_) {}
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}
