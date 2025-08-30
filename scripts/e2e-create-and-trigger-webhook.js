/*
One-shot end-to-end script:
- Creates an order via your local Next.js server: POST http://localhost:3000/api/order/create
- Calls Xendit-like webhook (signed) to the public NGROK_URL you provide
- Validates tickets were created in the DB via DATABASE_URL

Usage (set env and run):

export NGROK_URL="https://<your-ngrok>.ngrok.app"
export XENDIT_WEBHOOK_SECRET="<your-webhook-secret>"  # should match env in your running Next process
source .env  # to load DATABASE_URL and XENDIT_API_KEY if you want
node scripts/e2e-create-and-trigger-webhook.js

Preconditions:
- Your Next app must be running locally (npm run dev) and reachable at http://localhost:3000
- You must have ngrok forwarding from 3000 to a public URL and set NGROK_URL accordingly
- If your webhook handler requires a secret, set XENDIT_WEBHOOK_SECRET to the same value in the environment used by your Next server
*/

import 'dotenv/config'
import crypto from 'crypto'
import pg from 'pg'

const NGROK_URL = process.env.NGROK_URL
const WEBHOOK_SECRET = process.env.XENDIT_WEBHOOK_SECRET
const LOCAL_BASE = process.env.LOCAL_BASE_URL || 'http://localhost:3000'

if (!NGROK_URL) {
  console.error('Please set NGROK_URL env var to your ngrok public URL (e.g. https://abc123.ngrok.app)')
  process.exit(1)
}
if (!WEBHOOK_SECRET) {
  console.error('Please set XENDIT_WEBHOOK_SECRET env var to match the secret used by your local server (if verification enabled)')
  process.exit(1)
}

async function createOrder() {
  const query = 'reguler=2&vip=1'
  const body = { query, email: 'e2e+buyer@example.test', fullName: 'E2E Buyer' }
  const res = await fetch(`${LOCAL_BASE}/api/order/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`create order failed: ${JSON.stringify(json)}`)
  return json
}

function computeSignature(raw, secret) {
  const h = crypto.createHmac('sha256', secret).update(raw).digest('base64')
  return h
}

async function triggerWebhook({ orderId, invoiceId }) {
  const raw = JSON.stringify({ data: { external_id: `order_${orderId}`, id: invoiceId } })
  const sig = computeSignature(raw, WEBHOOK_SECRET)

  const res = await fetch(`${NGROK_URL.replace(/\/$/, '')}/api/webhooks/xendit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-xendit-signature': sig,
    },
    body: raw,
  })
  const text = await res.text()
  return { status: res.status, body: text }
}

async function checkTickets(orderId) {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.warn('DATABASE_URL not set; skipping DB verification')
    return null
  }
  const pool = new pg.Pool({ connectionString: DATABASE_URL })
  const client = await pool.connect()
  try {
    const rows = await client.query('SELECT id, short_code, entry_token, issued_at FROM tickets WHERE order_id = $1', [orderId])
    return rows.rows
  } finally {
    client.release()
    await pool.end()
  }
}

async function main() {
  console.log('Creating order via local server...')
  const created = await createOrder()
  console.log('Create response:', created)
  const { orderId, invoiceId, invoiceUrl } = created
  if (!orderId || !invoiceId) {
    console.error('create-order did not return orderId or invoiceId; aborting')
    process.exit(1)
  }

  console.log('Triggering webhook to', `${NGROK_URL}/api/webhooks/xendit`)
  const webhookRes = await triggerWebhook({ orderId, invoiceId })
  console.log('Webhook response:', webhookRes.status, webhookRes.body)

  console.log('Waiting 1s for server to process...')
  await new Promise(r => setTimeout(r, 1000))

  console.log('Checking DB for tickets...')
  const tickets = await checkTickets(orderId)
  console.log('Tickets found:', tickets)
}

main().catch(err => { console.error('E2E script error', err); process.exit(1) })
