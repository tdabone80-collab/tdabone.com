"use client"

import React from 'react'
import Link from 'next/link'

type Props = {
  id: string
  name: string
  price: number
  includes: string[]
}

export default function TicketCard({ id, name, price, includes }: Props) {
  return (
  <div className="w-full h-32 sm:h-36 flex flex-row justify-between items-center px-3 py-2 gap-6 bg-white border border-gray-200 rounded-xl box-border">
      {/* Left: image + details (Frame 16) */}
      <div className="flex flex-row items-start gap-4 sm:gap-6 flex-1">
        <div className="w-28 h-28 sm:w-28 sm:h-28 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500">Img</div>
        <div className="flex flex-col items-start gap-2 flex-grow">
          <div className="text-lg sm:text-[20px] leading-6 font-medium truncate">{name}</div>
          <div className="flex items-center gap-2 text-xs text-gray-400">{/* date */}
            <span className="w-4 h-4" aria-hidden>🕒</span>
            <span>30 Aug 25</span>
          </div>
          <div className="text-sm sm:text-[16px] leading-6 text-black truncate">Include {includes.join(', ')}</div>
        </div>
      </div>

      {/* Right: RSVP + price (Frame 25) */}
      <div className="flex flex-col justify-center items-end gap-3 w-20 sm:w-24">
        <Link href={`/order/review?${new URLSearchParams({ [id]: '1' }).toString()}`} className="block">
          <div className="w-20 sm:w-24 h-12 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center px-3">
            <span className="text-base sm:text-lg">RSVP</span>
          </div>
        </Link>
        <div className="text-sm sm:text-[16px] font-semibold">IDR {price.toLocaleString('id-ID')}</div>
      </div>
    </div>
  )
}
