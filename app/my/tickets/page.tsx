/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React from 'react'
import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'

type Ticket = {
  id: string
  entryToken: string
  shortCode: string
  issuedAt: string | null
  checkedInAt: string | null
  status: string
  ticketType?: string | null
  buyerName?: string | null
}

export default function MyTicketsPage() {
  const [loading, setLoading] = React.useState(true)
  const [tickets, setTickets] = React.useState<Ticket[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const pollingRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/my/tickets')
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          if (res.status === 401) {
            setError('Not signed in')
            setLoading(false)
            return
          }
          setError(j?.error || 'Failed to load')
          setLoading(false)
          return
        }
        const j = await res.json()
        if (!mounted) return
        setTickets(j.tickets || [])
        // if there are unscanned tickets, start polling to refresh status
        const hasUnscanned = (j.tickets || []).some((t: Ticket) => !t.checkedInAt)
        if (hasUnscanned && !pollingRef.current) {
          pollingRef.current = window.setInterval(async () => {
            try {
              const r = await fetch('/api/my/tickets')
              if (!r.ok) return
              const jj = await r.json()
              if (!mounted) return
              setTickets(jj.tickets || [])
              const stillUnscanned = (jj.tickets || []).some((t: Ticket) => !t.checkedInAt)
              if (!stillUnscanned && pollingRef.current) {
                clearInterval(pollingRef.current)
                pollingRef.current = null
              }
            } catch (e) {
              // ignore polling errors silently
            }
          }, 5000)
        }
      } catch (e: any) {
        setError(e?.message || 'Network error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [])

  if (loading) return <div className="p-6">Loading tickets…</div>
  if (error) {
    if (error === 'Not signed in') {
      return (
        <main className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
            <h1 className="text-xl font-semibold mb-4">My Tickets</h1>
            <div className="text-gray-700">You need to sign in to view your tickets.</div>
            <div className="mt-4">
              <Link href="/sign-in" className="inline-block px-4 py-2 bg-blue-600 text-white rounded">Sign in</Link>
            </div>
          </div>
        </main>
      )
    }
    return <div className="p-6 text-red-600">{error}</div>
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-4">My Tickets</h1>
        {tickets.length === 0 ? (
          <div className="text-gray-500">You have no tickets yet.</div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => (
              <div key={t.id} className="border p-4 rounded flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm">Kode: <strong>{t.shortCode}</strong></div>
                  <div className="text-xs text-gray-500">Issued: {t.issuedAt ? new Date(t.issuedAt).toLocaleString() : '-'}</div>
                  <div className={`text-xs ${t.checkedInAt ? 'text-green-600' : 'text-gray-600'}`}>{t.checkedInAt ? `Checked: ${new Date(t.checkedInAt).toLocaleString()}` : 'Not scanned'}</div>
                </div>

                <div className="flex items-center gap-4">
                  {t.status !== 'PAID' ? (
                    <div className="px-3 py-2 bg-yellow-100 text-sm rounded">Payment pending</div>
                  ) : t.checkedInAt ? (
                    <div className="px-3 py-2 bg-gray-100 text-sm rounded">Ticket used</div>
                  ) : (
                    <div className="w-28 h-28 bg-white p-2 border flex items-center justify-center">
                      <QRCodeCanvas value={t.entryToken} size={200} includeMargin={true} level="M" className="w-24 h-24" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
