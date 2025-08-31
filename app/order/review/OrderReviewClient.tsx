"use client"

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'react-bootstrap-icons'
// Link not needed here; we perform client-side POST and redirect
import { useSearchParams } from 'next/navigation'

type TicketDef = {
    id: string
    name: string
    price: number
}

const DEFAULT_TICKETS: TicketDef[] = [
    { id: 'reguler', name: 'Tiket Reguler', price: 150_000 },
    { id: 'vip', name: 'Tiket VIP', price: 300_000 },
    { id: 'early', name: 'Early Bird', price: 100_000 },
]

export default function OrderReviewPageClient() {
    const search = useSearchParams()
    const router = useRouter()

    const items = useMemo(() => {
        if (!search) return []
        return DEFAULT_TICKETS.map((t) => {
            const q = Number(search.get(t.id) || 0)
            return { ...t, quantity: isNaN(q) ? 0 : q }
        }).filter((x) => x.quantity > 0)
    }, [search])

    const total = useMemo(() => items.reduce((s, it) => s + it.quantity * it.price, 0), [items])

    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    return (
            <main className="min-h-screen bg-gray-100 py-10 px-6">
            <div className="mx-auto max-w-md">
                    <div className="flex justify-between gap-3 mb-4">
                        <button
                            type="button"
                            aria-label="Kembali"
                            onClick={() => {
                                // try to navigate back, otherwise go to /tickets
                                try {
                                    router.back()
                                } catch {
                                    window.location.href = '/tickets'
                                }
                            }}
                            className="group flex items-center gap-2 px-3 py-1 border rounded-md text-sm hover:bg-gray-100 transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4 transform transition-transform duration-150 ease-in-out group-hover:-translate-x-1" aria-hidden />
                            <span>Kembali</span>
                        </button>
                        <h1 className="text-xl font-semibold">Tinjau Pesanan</h1>
                    </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    {items.length === 0 ? (
                        <div className="text-center text-gray-600 py-8">Belum ada tiket yang dipilih.</div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((it) => (
                                <div key={it.id} className="flex justify-between items-center">
                                    <div>
                                        <div className="text-sm">{it.quantity}x {it.name}</div>
                                        <div className="text-xs text-gray-500">Rp {it.price.toLocaleString('id-ID')} per unit</div>
                                    </div>
                                    <div className="text-sm">Rp {(it.quantity * it.price).toLocaleString('id-ID')}</div>
                                </div>
                            ))}

                            <div className="border-t pt-3 flex justify-between font-semibold">
                                <div>Total</div>
                                <div>Rp {total.toLocaleString('id-ID')}</div>
                            </div>
                        </div>
                    )}
                </div>

                        <div className="mt-6">
                            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
                            <button
                                onClick={async () => {
                                    if (!search) return
                                    if (items.length === 0) return
                                    setLoading(true)
                                    setError(null)
                                    try {
                                        const res = await fetch('/api/order/create', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ query: search.toString() }),
                                        })
                                        const json = await res.json()
                                        if (!res.ok) {
                                            setError(json?.error || json?.detail || 'Gagal membuat pesanan')
                                            setLoading(false)
                                            return
                                        }
                                        const invoiceUrl = json?.invoiceUrl
                                        if (!invoiceUrl) {
                                            setError('Invoice URL tidak tersedia')
                                            setLoading(false)
                                            return
                                        }
                                        // Redirect to Xendit invoice
                                        window.location.href = invoiceUrl
                                    } catch (e) {
                                        setError((e as Error)?.message || String(e))
                                        setLoading(false)
                                    }
                                }}
                                disabled={loading || items.length === 0}
                                className={`w-full px-4 py-3 rounded-lg text-white ${loading || items.length === 0 ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {loading ? 'Menyiapkan pembayaran...' : 'Bayar Sekarang'}
                            </button>
                        </div>
            </div>
        </main>
    )
}
