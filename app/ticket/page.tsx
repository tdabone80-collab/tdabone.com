"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { QRCodeCanvas } from 'qrcode.react'

type TicketInfo = {
  ticket: {
    id: string
    entryToken: string
    shortCode: string
    status: string
    issuedAt: string | null
    checkedInAt: string | null
    ticketType?: string | null
    buyerName?: string | null
  }
  order?: { id: string; status?: string } | null
}

export default function TicketPage() {
  const search = useSearchParams()
  const token = search?.get('token')
  const short = search?.get('short')

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<TicketInfo | null>(null)

  React.useEffect(() => {
    const key = token || short
    if (!key) return
    setLoading(true)
    setError(null)
    fetch(`/api/ticket/info?${token ? `token=${encodeURIComponent(token)}` : `short=${encodeURIComponent(short || '')}`}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j || j.error) {
          setError(j?.error || 'Ticket not found')
          setData(null)
        } else {
          setData(j)
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [token, short])

  if (!token && !short) return <main style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>Provide ?token= or ?short= in the URL</main>

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Ticket Info</h1>
      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : !data ? (
        <div>No data</div>
      ) : (
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
          <div style={{ marginBottom: 8 }}><strong>Short:</strong> {data.ticket.shortCode}</div>
          <div style={{ marginBottom: 8 }}><strong>Type:</strong> {data.ticket.ticketType || '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Buyer:</strong> {data.ticket.buyerName || '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Order status:</strong> {data.order?.status || '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Ticket status:</strong> {data.ticket.status}</div>
          <div style={{ marginBottom: 8 }}><strong>Issued:</strong> {data.ticket.issuedAt ? new Date(data.ticket.issuedAt).toLocaleString() : '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Checked in:</strong> {data.ticket.checkedInAt ? new Date(data.ticket.checkedInAt).toLocaleString() : 'Not yet'}</div>

          {/* Show QR only when ticket is PAID and not checked-in */}
          {data.order?.status === 'PAID' && !data.ticket.checkedInAt ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ width: 200, height: 200, margin: '0 auto', padding: 8, background: '#fff', border: '1px solid #eee' }}>
                <QRCodeCanvas value={data.ticket.entryToken} size={200} includeMargin={true} level="M" />
              </div>
              <div style={{ marginTop: 8, textAlign: 'center' }}>Show this QR at the gate</div>
            </div>
          ) : (
            <div style={{ marginTop: 12, color: '#666' }}>{data.ticket.checkedInAt ? 'Ticket already checked in' : 'Ticket not paid yet'}</div>
          )}
        </div>
      )}
    </main>
  )
}
