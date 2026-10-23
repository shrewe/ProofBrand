import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ReviewHistory } from '@/components/history/review-history'

export const metadata: Metadata = { title: 'Review History' }

export default function ReviewsPage() {
  return (
    <Suspense>
      <ReviewHistory />
    </Suspense>
  )
}
