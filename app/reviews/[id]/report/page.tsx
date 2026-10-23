import type { Metadata } from 'next'
import { ReviewReport } from '@/components/report/review-report'

export const metadata: Metadata = { title: 'Review Report' }

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ReviewReport id={id} />
}
