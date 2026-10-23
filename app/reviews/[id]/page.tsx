import type { Metadata } from 'next'
import { ReviewWorkspace } from '@/components/review/review-workspace'

export const metadata: Metadata = { title: 'Review' }

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ReviewWorkspace id={id} />
}
