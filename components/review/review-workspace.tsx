'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, BadgeCheck, CheckCircle2, FileDown, ShieldCheck, Undo2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { RiskBadge, ReviewStatusBadge } from '@/components/status-badges'
import { PageContainer } from '@/components/page-header'
import { revalidateReviews, useReview } from '@/lib/hooks'
import { updateReview } from '@/lib/services'
import { categoryLabel, correctedText, reviewRisk, reviewStatus, unresolved } from '@/lib/review-utils'
import { formatDateTime } from '@/lib/format'
import type { Finding, FindingStatus, Review } from '@/lib/types'
import { FindingCard } from './finding-card'
import { HighlightedContent } from './highlighted-content'
import { CorrectedPanel } from './corrected-panel'
import { ReviewNotFound, WorkspaceSkeleton } from './workspace-states'

type Filter = 'all' | 'unresolved' | 'fixed'

export function ReviewWorkspace({ id }: { id: string }) {
  const { data: review, isLoading, mutate } = useReview(id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const cardRefs = useRef(new Map<string, HTMLElement>())

  const derived = useMemo(() => {
    if (!review) return null
    const { segments, corrected } = correctedText(review)
    return {
      segments,
      corrected,
      risk: reviewRisk(review),
      status: reviewStatus(review),
      open: unresolved(review.findings),
      fixed: review.findings.filter((f) => f.status === 'fixed'),
    }
  }, [review])

  if (isLoading) return <WorkspaceSkeleton />
  if (!review || !derived) return <ReviewNotFound />

  async function persist(next: Review, message?: string) {
    await mutate(next, { revalidate: false })
    try {
      await updateReview(next)
      await revalidateReviews()
      if (message) toast.success(message)
    } catch (e) {
      toast.error('Could not save changes', { description: e instanceof Error ? e.message : undefined })
      await mutate()
    }
  }

  function setStatus(findingId: string, status: FindingStatus, message?: string) {
    if (!review) return
    persist(
      {
        ...review,
        approved: false,
        findings: review.findings.map((f) => (f.id === findingId ? { ...f, status } : f)),
      },
      message,
    )
  }

  function fixAll() {
    if (!review) return
    const count = review.findings.filter((f) => f.status !== 'fixed' && f.edits.length > 0).length
    persist(
      {
        ...review,
        findings: review.findings.map((f) => (f.edits.length > 0 ? { ...f, status: 'fixed' } : f)),
      },
      `${count} fix${count === 1 ? '' : 'es'} applied`,
    )
  }

  function select(fid: string) {
    setSelectedId(fid)
    if (filter === 'fixed' && review?.findings.find((f) => f.id === fid)?.status !== 'fixed') setFilter('all')
    requestAnimationFrame(() =>
      cardRefs.current.get(fid)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
    )
  }

  const visible = review.findings.filter((f) =>
    filter === 'all' ? true : filter === 'fixed' ? f.status === 'fixed' : f.status !== 'fixed',
  )
  const canApprove = derived.open.length === 0 && !review.approved
  const fixable = review.findings.some((f) => f.status !== 'fixed' && f.edits.length > 0)

  return (
    <PageContainer className="max-w-7xl">
      <div className="mb-5">
        <Link
          href="/reviews"
          className="inline-flex items-center gap-1 rounded text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Review history
        </Link>
      </div>

      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <ReviewStatusBadge status={derived.status} />
            <RiskBadge risk={derived.risk} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{review.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {review.brandName} · {review.productName} · Analyzed {formatDateTime(review.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" render={<Link href={`/reviews/${review.id}/report`} />} nativeButton={false}>
            <FileDown data-icon="inline-start" aria-hidden="true" />
            Export report
          </Button>
          {fixable && (
            <Button variant="outline" onClick={fixAll}>
              <Wand2 data-icon="inline-start" aria-hidden="true" />
              Apply all fixes
            </Button>
          )}
          {review.approved ? (
            <Button variant="outline" onClick={() => persist({ ...review, approved: false }, 'Approval withdrawn')}>
              <Undo2 data-icon="inline-start" aria-hidden="true" />
              Withdraw approval
            </Button>
          ) : (
            <Button
              onClick={() => persist({ ...review, approved: true }, 'Content approved for publishing')}
              disabled={!canApprove}
              title={canApprove ? undefined : 'Resolve all findings before approving'}
            >
              <ShieldCheck data-icon="inline-start" aria-hidden="true" />
              Approve
            </Button>
          )}
        </div>
      </header>

      <Stats review={review} open={derived.open} fixed={derived.fixed.length} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="original-heading" className="rounded-xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
              <h2 id="original-heading" className="text-sm font-semibold">
                Original content
              </h2>
              <Legend />
            </div>
            <div className="px-5 py-4">
              <HighlightedContent
                content={review.content}
                findings={review.findings}
                selectedId={selectedId}
                onSelect={select}
              />
            </div>
          </section>

          <CorrectedPanel corrected={derived.corrected} segments={derived.segments} fixedCount={derived.fixed.length} />

          {review.verified.length > 0 && (
            <section aria-labelledby="verified-heading" className="rounded-xl border bg-card">
              <h2 id="verified-heading" className="border-b px-5 py-3 text-sm font-semibold">
                Verified claims
              </h2>
              <ul className="divide-y">
                {review.verified.map((v) => (
                  <li key={v.id} className="flex gap-3 px-5 py-3">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">“{v.excerpt}”</p>
                      <p className="text-muted-foreground">
                        {v.note} · <span className="text-foreground/80">{v.evidence.sourceLabel}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <section aria-labelledby="findings-heading" className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start">
          <div className="flex items-center justify-between gap-2">
            <h2 id="findings-heading" className="text-sm font-semibold">
              Findings <span className="text-muted-foreground">({review.findings.length})</span>
            </h2>
            <div role="group" aria-label="Filter findings" className="flex rounded-lg bg-muted p-0.5 text-xs">
              {(['all', 'unresolved', 'fixed'] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className="rounded-md px-2.5 py-1 font-medium capitalize text-muted-foreground transition-colors aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm focus-visible:ring-2 focus-visible:ring-ring outline-none"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="-mr-2 flex flex-col gap-3 overflow-y-auto pr-2 pb-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-10 text-center"
                >
                  <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
                  <p className="text-sm font-medium">
                    {filter === 'fixed' ? 'No fixes applied yet' : 'Nothing left to resolve'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {filter === 'fixed'
                      ? 'Apply a suggested fix to see it here.'
                      : 'Every finding is fixed. This content is ready for approval.'}
                  </p>
                </motion.div>
              ) : (
                visible.map((f) => (
                  <FindingCard
                    key={f.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(f.id, el)
                      else cardRefs.current.delete(f.id)
                    }}
                    finding={f}
                    selected={selectedId === f.id}
                    onSelect={() => setSelectedId(f.id)}
                    onApplyFix={() => setStatus(f.id, 'fixed', `${categoryLabel[f.category]} fixed`)}
                    onUndo={() => setStatus(f.id, f.evidence ? 'open' : 'needs-verification')}
                    onToggleVerification={() =>
                      setStatus(f.id, f.status === 'needs-verification' ? 'open' : 'needs-verification')
                    }
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </PageContainer>
  )
}

function Stats({ review, open, fixed }: { review: Review; open: Finding[]; fixed: number }) {
  const items = [
    { label: 'Total findings', value: review.findings.length },
    { label: 'High severity open', value: open.filter((f) => f.severity === 'high').length, tone: 'text-danger' },
    { label: 'Needs verification', value: open.filter((f) => f.status === 'needs-verification').length, tone: 'text-warning' },
    { label: 'Fixed', value: fixed, tone: 'text-success' },
  ]
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">{i.label}</dt>
          <dd className={`mt-0.5 text-xl font-semibold tabular-nums ${i.value > 0 && i.tone ? i.tone : ''}`}>{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Legend() {
  const items = [
    { label: 'High', cls: 'bg-danger-soft border-b-2 border-danger' },
    { label: 'Medium', cls: 'bg-warning-soft border-b-2 border-warning' },
    { label: 'Fixed', cls: 'bg-success-soft border-b-2 border-success' },
  ]
  return (
    <ul className="flex items-center gap-3 text-xs text-muted-foreground" aria-label="Highlight legend">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-4 rounded-sm ${i.cls}`} aria-hidden="true" />
          {i.label}
        </li>
      ))}
    </ul>
  )
}
