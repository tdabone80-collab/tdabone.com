"use client"

import React, { useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { BoxArrowRight, CheckCircleFill, XCircleFill } from 'react-bootstrap-icons'
// using native button for sign-out so styling can be applied directly with Tailwind

type DbUser = {
  id: string
  clerkUserId: string
  email: string
  fullName?: string | null
  whatsappE164?: string | null
  role?: string
  profileCompletedAt?: string | null
}

export default function UserCard() {
  const { isLoaded, isSignedIn, user } = useUser()
  const clerk = useClerk()
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    setLoading(true)
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((json) => {
        if (json?.ok && json.user) setDbUser(json.user)
      })
      .catch((err) => console.error('Failed to fetch DB user', err))
      .finally(() => setLoading(false))
  }, [isLoaded, isSignedIn])

  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Link href="/sign-in" className="block w-full px-4 py-3 text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          Masuk
        </Link>
      </div>
    )
  }

  const name = user.fullName || user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim()
  const displayName = name ? (name.length > 24 ? name.slice(0, 21) + '...' : name) : 'Pengguna'
  const u = user as unknown as Record<string, string | undefined>
  const profileImage = u.profileImageUrl || u.imageUrl || '/vercel.svg'

  const profileComplete = Boolean(dbUser?.profileCompletedAt)

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-12 items-center gap-0 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        {/* Main clickable area */}
        <div className="col-span-10">
          <Link href="/profile" className="block no-underline">
            <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <div className="flex-shrink-0">
                <Image src={profileImage} alt={displayName} width={56} height={56} className="rounded-lg object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium text-gray-900 dark:text-white">{displayName}</div>
                <div className="mt-1 text-xs">
                  {loading ? (
                    <span className="text-muted-foreground dark:text-gray-300">Memuat status...</span>
                  ) : profileComplete ? (
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                      <span>Profil lengkap</span>
                      <CheckCircleFill className="w-3 h-3" aria-hidden />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-red-600 dark:text-red-400">
                      <span>Profil belum lengkap</span>
                      <XCircleFill className="w-3 h-3" aria-hidden />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Sign out area */}
        <div className="col-span-2 border-l border-gray-100 dark:border-slate-700 p-2 flex items-center justify-center w-full h-full">
          {/* Native icon button styled with Tailwind; calls Clerk signOut */}
          <button
            type="button"
            onClick={async () => {
              try {
                await clerk.signOut()
              } catch (err) {
                console.error('Sign out failed', err)
              }
            }}
            aria-label="Sign out"
            className="flex items-center justify-center w-full h-full px-3 py-1 text-sm text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            <BoxArrowRight className="w-5 h-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
