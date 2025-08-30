"use client"

import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'

export default function FloatingFooter() {
  const pathname = usePathname()
  const [visible, setVisible] = React.useState(true)
  const lastY = React.useRef(0)

  React.useEffect(() => {
    lastY.current = typeof window !== 'undefined' ? window.scrollY : 0
    let raf = 0
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastY.current
        // scrolling down -> hide, up -> show (thresholds to avoid jitter)
        if (delta > 20) setVisible(false)
        else if (delta < -20) setVisible(true)
        lastY.current = y
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Hide footer on admin routes
  if (pathname && pathname.startsWith('/admin')) return null

  return (
    <footer
      role="navigation"
      aria-label="Floating menu"
      className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm">
          <Link href="/" aria-label="Home" className="px-3 py-1 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50">Home</Link>

          <Link href="/tickets" aria-label="Tickets" className="px-3 py-1 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50">Tickets</Link>

          {/* Center floating action */}
          <Link href="/scan" aria-label="Main menu" className="-mt-4">
            <div className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold shadow">Scan</div>
          </Link>

          <Link href="/order/review" aria-label="Orders" className="px-3 py-1 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50">Orders</Link>

          <Link href="/admin" aria-label="Admin" className="px-3 py-1 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50">Admin</Link>
        </div>

        <div className="mt-2 text-center w-svw">
          <a href="https://jasabuataplikasi.id" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-sm text-xs text-gray-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
              <rect x="3" y="3" width="18" height="18" rx="3" fill="#111827" />
            </svg>
            Made by Jaba
          </a>
        </div>
      </div>
    </footer>
  )
}
