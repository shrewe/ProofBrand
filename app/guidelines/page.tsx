import type { Metadata } from 'next'
import { Suspense } from 'react'
import { GuidelinesView } from '@/components/guidelines/guidelines-view'

export const metadata: Metadata = { title: 'Brand Guidelines' }

export default function GuidelinesPage() {
  return (
    <Suspense>
      <GuidelinesView />
    </Suspense>
  )
}
