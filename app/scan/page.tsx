/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import QRScanner from "@/components/QRScanner";
import { useRouter } from "next/navigation";
import Link from 'next/link'

export default function Page() {
  const router = useRouter();
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true)
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null)
  const [email, setEmail] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/whoami')
        if (!mounted) return
        if (!res.ok) {
          setIsAdmin(false)
          setError('Not signed in')
          setLoading(false)
          return
        }
        const j = await res.json()
        setEmail(j.email || null)
        setIsAdmin(Boolean(j.isAdmin))
      } catch (e: any) {
        setError(e?.message || 'Failed to verify admin')
        setIsAdmin(false)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleDetected = (result: string) => {
    try {
      const person = JSON.parse(result);
      if (person.id && person.name && person.email) {
        const query = new URLSearchParams({
          id: person.id,
          name: person.name,
          email: person.email,
          paid: person.paid ? "true" : "false",
        }).toString();
        router.push(`/profile?${query}`);
      } else {
        alert("Invalid QR code data");
      }
    } catch (error) {
      // If it's not JSON, assume it's a ticket entryToken (e.g. 'ticket_xxx') and call the scan API
      console.warn('QR not JSON, assuming entryToken or plain text', error)
      ;(async () => {
        try {
          setStatus('Checking ticket...')
          const res = await fetch('/api/ticket/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entryToken: result }),
          })
          const j = await res.json()
          if (!res.ok) {
            // common cases: 404 not found, 409 already scanned, 401/403 auth
            const msg = j?.error || `Status ${res.status}`
            setStatus(`Scan failed: ${msg}`)
            alert(`Scan failed: ${msg}`)
            return
          }

          // success
          const checkedAt = j.checkedInAt ? new Date(j.checkedInAt).toLocaleString() : new Date().toLocaleString()
          setStatus(`Checked in: ${checkedAt}`)
          if (navigator.vibrate) navigator.vibrate(100)
        } catch (e) {
          console.warn('scan network error', e)
          setStatus('Scan error')
          alert('Network error while scanning')
        }
      })()
    }
  };

  if (loading) return <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>Loading…</main>

  if (!isAdmin) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>QR Scanner</h1>
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
          <p style={{ marginBottom: 8 }}>Access denied. Your account ({email || 'unknown'}) is not authorized to use the scanner.</p>
          <p style={{ fontSize: 13, color: '#666' }}>Only admins listed in <code>ADMIN_WHITELIST</code> may scan tickets.</p>
          <div style={{ marginTop: 12 }}>
            <Link href="/" className="inline-block px-3 py-2 bg-gray-200 rounded">Back</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>QR Scanner</h1>
      <QRScanner onDetected={handleDetected} />
      {status && <div style={{ marginTop: 12, fontSize: 13 }}>{status}</div>}
      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 12 }}>
        Tip: open this page on your phone. iOS/Android require HTTPS (or localhost) for camera access.
      </p>
    </main>
  );
}