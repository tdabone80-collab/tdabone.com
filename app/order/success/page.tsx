"use client"

import React from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { useSearchParams } from 'next/navigation'
// QR rendering intentionally implemented as text for now; replace with a QR generator later.

type Ticket = {
  id: string
  entryToken: string
  shortCode: string
  issuedAt: string | null
  checkedInAt: string | null
  status: string
}

export default function OrderSuccessPage() {
  const search = useSearchParams()
  const orderId = search?.get('orderId')

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [order, setOrder] = React.useState<Record<string, unknown> | null>(null)
  const [tickets, setTickets] = React.useState<Ticket[]>([])

  React.useEffect(() => {
    if (!orderId) return
    setLoading(true)
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((j) => {
        setOrder(j.order)
        setTickets(j.tickets || [])
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [orderId])

  async function scanTicket(token: string, idx: number) {
    setError(null)
    try {
      const res = await fetch('/api/ticket/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryToken: token }),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j?.error || 'Scan failed')
        return
      }
      // update ticket
      setTickets((t) => t.map((tk, i) => (i === idx ? { ...tk, checkedInAt: j.checkedInAt, status: 'PAID' } : tk)))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (!orderId) return <div className="p-6">Missing orderId</div>

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-4">Detail Pesanan</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div>
            <div className="mb-3">Order: <strong>{orderId}</strong></div>
            <div className="mb-3">Status pembayaran: <strong>{String(order?.status || 'UNKNOWN')}</strong></div>

            <h2 className="mt-4 mb-2 font-medium">Tiket</h2>
            {tickets.length === 0 ? (
              <div className="text-gray-500">Belum ada tiket</div>
            ) : (
              <div className="grid gap-4">
                {tickets.map((t, i) => (
                  <div key={t.id} className="border p-3 rounded flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm">Kode: <strong>{t.shortCode}</strong></div>
                      <div className="text-xs text-gray-500">Issued: {t.issuedAt ? new Date(t.issuedAt).toLocaleString() : '-'}</div>
                      <div className={`text-xs ${t.checkedInAt ? 'text-green-600' : 'text-gray-600'}`}>{t.checkedInAt ? `Diperiksa: ${new Date(t.checkedInAt).toLocaleString()}` : 'Belum dipindai'}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-28 h-28 bg-white p-2 border flex items-center justify-center">
                          {/* Render QR client-side using qrcode.react */}
                          <QRCodeCanvas
                            value={t.entryToken}
                            size={200}
                            includeMargin={true}
                            level="M"
                            aria-label={`QR for ${t.shortCode}`}
                            className="w-24 h-24"
                          />
                        </div>
                      <div className="flex flex-col gap-2">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => scanTicket(t.entryToken, i)}>Simulate Scan</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
