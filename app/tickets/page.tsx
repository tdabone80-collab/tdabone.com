"use client"

import Link from 'next/link'
import React, { useMemo, useState } from 'react'

type TicketDef = {
    id: string
    name: string
    price: number
    includes: string[]
}

const DEFAULT_TICKETS: TicketDef[] = [
    { id: 'reguler', name: 'Reguler ticket', price: 150_000, includes: ['A', 'B', 'C', 'D'] },
    { id: 'vip', name: 'VIP ticket', price: 300_000, includes: ['A', 'B', 'C', 'D'] },
    { id: 'early', name: 'Early bird', price: 100_000, includes: ['A', 'B', 'C', 'D'] },
]

export default function TicketsPage() {
    const [tickets] = useState<TicketDef[]>(DEFAULT_TICKETS)
    const [quantities, setQuantities] = useState<Record<string, number>>(
        () => Object.fromEntries(tickets.map((t) => [t.id, 0]))
    )

    const increase = (id: string) => setQuantities((q) => ({ ...q, [id]: (q[id] || 0) + 1 }))
    const decrease = (id: string) => setQuantities((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) - 1) }))

    const totalAmount = useMemo(() => {
        return tickets.reduce((sum, t) => sum + (quantities[t.id] || 0) * t.price, 0)
    }, [tickets, quantities])

    const query = useMemo(() => {
        const params = new URLSearchParams()
        tickets.forEach((t) => params.set(t.id, String(quantities[t.id] || 0)))
        return params.toString()
    }, [tickets, quantities])

    return (
        <main className="min-h-screen bg-gray-100 py-10 px-6 pb-24 sm:pb-10">
            <div className="mx-auto max-w-3xl">
                {/* Card container (Figma Frame 21) */}
            <div className="relative bg-white rounded-2xl shadow-sm p-6 sm:p-8">
                    {/* Header: logo + banner */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-28 h-20 rounded-md bg-white border border-gray-300 flex items-center justify-center">
                                <span className="text-xs font-semibold">LOGO</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">Banner event</h1>
                                <p className="text-sm text-gray-600">Tanggal · Lokasi</p>
                            </div>
                        </div>
                        <div className="w-20 h-20 rounded-full bg-white border flex items-center justify-center">
                            <div className="w-12 h-12 bg-black rounded-full" />
                        </div>
                    </div>

                    {/* Banner image */}
                    <div className="w-full h-56 sm:h-64 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-lg mb-6 overflow-hidden flex items-center justify-center">
                        <span className="text-gray-600">Event Banner</span>
                    </div>

                    {/* Ticket list (Frame 17) */}
                    <div className="space-y-4">
                        {tickets.map((t) => {
                            const qty = quantities[t.id] || 0
                            return (
                            <div key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-transform duration-150">
                                <div className="flex items-start gap-4 w-full sm:w-auto">
                                    <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gray-100 rounded-lg flex items-center justify-center">Img</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-lg font-medium truncate">{t.name}</div>
                                        <div className="text-sm text-gray-700 mt-1">Rp {t.price.toLocaleString('id-ID')}</div>
                                        <div className="mt-3 text-sm text-gray-600">
                                            <div className="font-medium">Include</div>
                                            <div className="flex gap-2 mt-1 text-sm text-gray-700 flex-wrap">
                                                {t.includes.map((inc) => (
                                                    <span key={inc} className="px-2 py-1 bg-gray-100 rounded-md">{inc}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-col items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                                    <div className="flex items-center gap-3">
                                        <button
                                            aria-label={`Kurangi ${t.name}`}
                                            onClick={() => decrease(t.id)}
                                            className="w-11 h-11 flex items-center justify-center rounded-md border border-gray-300 text-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                            disabled={qty <= 0}
                                        >
                                            −
                                        </button>
                                        <div className="w-12 text-center text-lg font-medium">{qty}</div>
                                        <button
                                            aria-label={`Tambah ${t.name}`}
                                            onClick={() => increase(t.id)}
                                            className="w-11 h-11 flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {qty > 0 ? (
                                        <Link href={`/order/review?${new URLSearchParams({ [t.id]: String(qty) }).toString()}`} className="w-full sm:w-auto">
                                            <button className="w-full sm:w-32 px-4 py-3 bg-blue-600 text-white rounded-lg">RSVP</button>
                                        </Link>
                                    ) : (
                                        <button className="w-full sm:w-32 px-4 py-3 border rounded-lg opacity-60 cursor-not-allowed" disabled>RSVP</button>
                                    )}
                                </div>
                            </div>
                            )
                        })}
                    </div>

                    {/* Footer actions */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center sm:justify-between gap-3">
                        <div className="text-sm text-gray-700">Total: Rp {totalAmount.toLocaleString('id-ID')}</div>
                        <Link href={`/order/review?${query}`} className="w-full sm:w-40">
                            <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg">Lanjut</button>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    )
}
