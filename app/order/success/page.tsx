import React, { Suspense } from 'react'
import SuccessClient from './SuccessClient'

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      {/* SuccessClient uses useSearchParams and must be rendered inside a Suspense boundary */}
      <SuccessClient />
    </Suspense>
  )
}
