"use client"

import React from 'react'

type TicketRow = {
  id: string
  shortCode: string
  entryToken: string
  issuedBy?: string | null
  buyerName?: string | null
  ticketType?: string | null
  status: string
  issuedAt: string | null
  checkedInAt: string | null
  orderId: string | null
  orderStatus: string | null
}

export default function AdminTicketsPage() {
  const [q, setQ] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [tickets, setTickets] = React.useState<TicketRow[]>([])
  const [error, setError] = React.useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const url = new URL('/api/admin/tickets', location.origin)
      if (q) url.searchParams.set('q', q)
      if (status) url.searchParams.set('status', status)
      const res = await fetch(url.href)
      const j = await res.json()
      if (!res.ok) {
        setError(j?.error || 'Failed to load')
        setTickets([])
      } else {
        setTickets(j.tickets || [])
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    (async () => {
      setLoading(true)
      setError(null)
      try {
        const url = new URL('/api/admin/tickets', location.origin)
        const res = await fetch(url.href)
        const j = await res.json()
        if (!res.ok) {
          setError(j?.error || 'Failed to load')
          setTickets([])
        } else {
          setTickets(j.tickets || [])
        }
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function doScan(entryToken: string, idx: number) {
    try {
      const res = await fetch('/api/ticket/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryToken }),
      })
      const j = await res.json()
      if (!res.ok) {
        alert(j?.error || 'Scan failed')
        return
      }
      setTickets((tks) => tks.map((r, i) => (i === idx ? { ...r, checkedInAt: j.checkedInAt, status: 'PAID' } : r)))
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Admin — Tickets</h1>
          <div className="text-sm text-gray-500">{tickets.length} results</div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            className="flex-1 px-3 py-2 rounded border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Search orderId / shortCode / token"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="w-40 px-3 py-2 rounded border border-gray-200 bg-white shadow-sm focus:outline-none"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="UNPAID">UNPAID</option>
          </select>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded shadow" onClick={load}>Search</button>
            <button className="px-4 py-2 bg-white border border-gray-200 rounded" onClick={() => { setQ(''); setStatus(''); load(); }}>Clear</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading…</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Short</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Buyer</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Ticket</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Order</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Issued</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Checked In</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {tickets.map((t, i) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 align-middle font-mono text-xs">{t.shortCode}</td>
                    <td className="px-3 py-3 align-middle text-xs">{t.buyerName || t.issuedBy || '-'}</td>
                    <td className="px-3 py-3 align-middle">
                      {t.ticketType ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">{t.ticketType}</span>
                      ) : <span className="text-xxs text-gray-400">-</span>}
                    </td>
                    <td className="px-3 py-3 align-middle text-xs">
                      <div>{t.orderId}</div>
                      <div className="text-xxs text-gray-400">{t.orderStatus}</div>
                    </td>
                    <td className="px-3 py-3 align-middle text-xs">{t.issuedAt ? new Date(t.issuedAt).toLocaleString() : '-'}</td>
                    <td className="px-3 py-3 align-middle text-xs">{t.checkedInAt ? new Date(t.checkedInAt).toLocaleString() : '-'}</td>
                    <td className="px-3 py-3 align-middle text-xs">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <div className="flex gap-2">
                        {t.checkedInAt ? (
                          <button className="px-3 py-1 bg-gray-200 text-gray-600 rounded" disabled>Checked</button>
                        ) : (
                          <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => doScan(t.entryToken, i)}>Mark Check-in</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status || '').toUpperCase()
  if (s === 'PAID') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">PAID</span>
  if (s === 'PENDING') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">PENDING</span>
  if (s === 'UNPAID') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">UNPAID</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{status || '-'}</span>
}
