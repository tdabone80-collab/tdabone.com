import React, { Suspense } from 'react'
import TicketPage from './ticketClient'

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading…</div>}>
            {/* OrderReviewClient is a client component that uses useSearchParams */}
            <TicketPage />
        </Suspense>
    )
}
