/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React from 'react'
import Link from 'next/link'

export default function AdminPageClient() {
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/whoami')
        if (!res.ok) {
          setError('Not signed in')
          setLoading(false)
          return
        }
        const j = await res.json()
        if (!mounted) return
        setData(j)
      } catch (e: any) {
        setError(e?.message || 'Failed')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <main className="min-h-screen flex items-center justify-center">Loading…</main>
  if (error) return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Not signed in</h2>
        <p className="text-sm text-gray-600 mb-4">Please sign in with Clerk to access admin pages.</p>
        <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded">Go to home</Link>
      </div>
    </main>
  )

  const isAdmin = data?.isAdmin
  const adminList = data?.adminList || []
  const email = data?.email || 'unknown'

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Access denied</h2>
          <p className="text-sm text-gray-600 mb-4">Your account ({email}) is not on the admin allow-list.</p>
          <p className="text-sm text-gray-500 mb-4">If you believe this is an error, add your email to <code className="text-xs bg-gray-100 px-2 py-1 rounded">ADMIN_WHITELIST</code> in the environment.</p>
          <Link href="/" className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded">Return</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <div className="mx-auto max-w-4xl">
        <div className="bg-white rounded-2xl shadow p-6">
          <header className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Restricted area — only emails in <code className="bg-gray-100 px-2 py-1 rounded">ADMIN_WHITELIST</code> can access.</p>
            </div>
            <nav className="flex items-center gap-3">
              <Link href="/admin/tickets" className="px-3 py-2 bg-blue-600 text-white rounded">Tickets</Link>
              <Link href="/admin/seed" className="px-3 py-2 bg-gray-100 text-gray-700 rounded">Seed</Link>
            </nav>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Allowed admins</h3>
              {adminList.length > 0 ? (
                <ul className="text-sm text-gray-700 space-y-1">
                  {adminList.map((e: string) => (
                    <li key={e} className="px-2 py-1 bg-gray-50 rounded">{e}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">No ADMIN_WHITELIST configured — page is open to any signed-in Clerk user.</p>
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Quick actions</h3>
              <div className="flex flex-col gap-3">
                <Link href="/admin/tickets" className="px-3 py-2 bg-blue-50 text-blue-700 rounded">View tickets</Link>
                <Link href="/scan" className="px-3 py-2 bg-green-50 text-green-700 rounded">Open scanner</Link>
                <Link href="/" className="px-3 py-2 bg-gray-50 text-gray-700 rounded">Back to site</Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
