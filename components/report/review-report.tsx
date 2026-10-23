'use client'

import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/logo'
import { FindingStatusBadge, RiskBadge, ReviewStatusBadge, SeverityBadge } from '@/components/status-badges'
import { useReview } from '@/lib/hooks'
import { categoryLabel, correctedText, reviewRisk, reviewStatus } from '@/lib/review-utils'
import { formatDateTime } from '@/lib/format'

export function ReviewReport({ id }: { id: string }) {
  const { data: review, isLoading } = useReview(id)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (!review) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-20 text-center">
        <h1 className="text-lg font-semibold text-foreground">Report not found</h1>
        <p className="text-sm text-muted-foreground">This review may have been deleted from this browser.</p>
        <Button render={<Link href="/reviews" />} nativeButton={false}>
          Go to Review History
        </Button>
      </div>
    )
  }

  const { corrected } = correctedText(review)
  const status = reviewStatus(review)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 print:max-w-none print:p-0">
      <div className="mb-4 flex items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" render={<Link href={`/reviews/${review.id}`} />} nativeButton={false}>
          <ArrowLeft aria-hidden="true" />
          Back to review
        </Button>
        <Button onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          Print / Save as PDF
        </Button>
      </div>

      <article className="rounded-xl border bg-card p-6 shadow-xs sm:p-10 print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-foreground">
            <Logo tone="light" />
          </div>
          <div className="text-left text-xs text-muted-foreground sm:text-right">
            <p className="font-medium text-foreground">Content Review Report</p>
            <p>Generated {formatDateTime(new Date().toISOString())}</p>
          </div>
        </header>

        <section className="mt-6">
          <h1 className="text-xl font-semibold text-balance text-foreground">{review.title}</h1>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Brand / product</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {review.brandName} · {review.productName}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Reviewed</dt>
              <dd className="mt-0.5 font-medium text-foreground">{formatDateTime(review.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <ReviewStatusBadge status={status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Open risk</dt>
              <dd className="mt-1">
                <RiskBadge risk={reviewRisk(review)} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          <div>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Original submission</h2>
            <p className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">{review.content}</p>
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Corrected draft</h2>
            <p className="rounded-lg border border-success/25 bg-success-soft/50 p-4 text-sm leading-relaxed text-foreground">
              {corrected || <span className="text-muted-foreground italic">No corrected content.</span>}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Findings ({review.findings.length})
          </h2>
          {review.findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No issues were found against the approved evidence.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {review.findings.map((f, i) => (
                <li key={f.id} className="break-inside-avoid rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {i + 1}. {categoryLabel[f.category]}
                    </span>
                    <SeverityBadge severity={f.severity} />
                    <FindingStatusBadge status={f.status} />
                  </div>
                  <p className="mt-2 text-sm text-foreground">
                    <span className="text-muted-foreground">Excerpt: </span>
                    <mark className="rounded bg-warning-soft px-1 text-foreground">{`"${f.excerpt}"`}</mark>
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.explanation}</p>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Evidence</p>
                      {f.evidence ? (
                        <p className="mt-0.5 text-foreground">
                          <span className="font-medium">{f.evidence.sourceLabel}</span> — {f.evidence.approvedValue}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-warning">No supporting source provided — needs verification.</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Suggested correction</p>
                      <p className="mt-0.5 text-foreground">{f.suggestion}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <footer className="mt-8 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
          Findings come from deterministic checks against the approved guideline records stored in this workspace. They are
          not output from an external AI service. ProofBrand — a product by NS Technologies.
        </footer>
      </article>
    </div>
  )
}
