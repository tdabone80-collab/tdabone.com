/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { getAuth, clerkClient } from '@clerk/nextjs/server'

export async function GET(req: Request) {
  const { userId } = getAuth(req as any)
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const primaryEmail = user.emailAddresses?.[0]?.emailAddress || null
    const fullName = user.fullName || null

  // Use helper to get canonicalized admin whitelist (lowercased)
  // We intentionally default to deny when the list is empty.
  // ...import the helper lazily so this file can stay minimal.
  const { getAdminWhitelist } = await import('@/lib/adminConfig')
  const whitelist = getAdminWhitelist()
  const emailLower = primaryEmail ? String(primaryEmail).toLowerCase() : null
  const isAdmin = whitelist.length === 0 ? false : (emailLower ? whitelist.includes(emailLower) : false)

  const resp: Record<string, unknown> = { userId, email: primaryEmail, fullName, isAdmin }
  if (isAdmin) resp.adminList = whitelist

  // Debug logging (guarded). Set DEBUG_WHOAMI=true or DEBUG=true in env to enable.
  try {
    const debug = (process.env.DEBUG_WHOAMI === 'true') || (process.env.DEBUG === 'true')
    if (debug) {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      const ua = req.headers.get('user-agent') || 'unknown'
      console.log('whoami debug:', {
        timestamp: new Date().toISOString(),
        userId,
        email: primaryEmail,
        fullName,
        isAdmin,
        adminList: whitelist,
        url: req.url,
        ip,
        ua,
      })
    }
  } catch (logErr) {
    // don't let logging break the response
    console.warn('whoami: debug log failed', logErr)
  }

  return NextResponse.json(resp)
  } catch (err) {
    console.warn('whoami error', err)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
