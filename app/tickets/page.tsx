"use client"

import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import TicketCard from '@/components/TicketCard'

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

    const totalAmount = useMemo(() => 0, [])
    const query = ''

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
                        {tickets.map((t) => (
                            <TicketCard
                                key={t.id}
                                id={t.id}
                                name={t.name}
                                price={t.price}
                                includes={t.includes}
                            />
                        ))}
                    </div>

                    {/* Footer actions */}
                    {/* <div className="mt-8 flex flex-col sm:flex-row items-center sm:justify-between gap-3">
                        <div className="text-sm text-gray-700">Total: Rp {totalAmount.toLocaleString('id-ID')}</div>
                        <Link href={`/order/review?${query}`} className="w-full sm:w-40">
                            <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg">Lanjut</button>
                        </Link>
                    </div> */}
                </div>
            </div>
        </main>
    )
}
