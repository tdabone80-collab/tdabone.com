import React, { Suspense } from 'react'
import OrderReviewClient from './OrderReviewClient'

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading…</div>}>
            {/* OrderReviewClient is a client component that uses useSearchParams */}
            <OrderReviewClient />
        </Suspense>
    )
}
