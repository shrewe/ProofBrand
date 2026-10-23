import type { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/page-header'
import { ReviewComposer } from '@/components/review/review-composer'

export const metadata: Metadata = { title: 'New Content Review' }

export default function NewReviewPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Review workspace"
        title="New content review"
        description="Paste marketing copy and ProofBrand will check every claim against approved brand rules, product facts, and offer records."
      />
      <ReviewComposer />
    </PageContainer>
  )
}
