'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FilePlus2, Inbox, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageContainer, PageHeader } from '@/components/page-header'
import { RiskBadge, ReviewStatusBadge, SeverityBadge } from '@/components/status-badges'
import { revalidateReviews, useReviews } from '@/lib/hooks'
import { deleteReview } from '@/lib/services'
import { highestSeverity, reviewRisk, reviewStatus } from '@/lib/review-utils'
import { formatDate } from '@/lib/format'
import type { Review } from '@/lib/types'

const statusItems = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending (any open issue)' },
  { value: 'changes-required', label: 'Changes required' },
  { value: 'in-review', label: 'In review' },
  { value: 'ready', label: 'Ready for approval' },
  { value: 'approved', label: 'Approved' },
]

const riskItems = [
  { value: 'all', label: 'All risk levels' },
  { value: 'high', label: 'High risk' },
  { value: 'medium', label: 'Medium risk' },
  { value: 'low', label: 'Low risk' },
  { value: 'none', label: 'No open risk' },
]

export function ReviewHistory() {
  const params = useSearchParams()
  const { data: reviews, isLoading, error } = useReviews()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(params.get('status') ?? 'all')
  const [risk, setRisk] = useState(params.get('risk') ?? 'all')
  const [pendingDelete, setPendingDelete] = useState<Review | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (reviews ?? []).filter((r) => {
      const s = reviewStatus(r)
      if (status === 'pending' ? !(s === 'changes-required' || s === 'in-review') : status !== 'all' && s !== status)
        return false
      if (risk !== 'all' && reviewRisk(r) !== risk) return false
      if (!q) return true
      return [r.title, r.brandName, r.productName, r.content].some((v) => v.toLowerCase().includes(q))
    })
  }, [reviews, query, status, risk])

  const hasFilters = query || status !== 'all' || risk !== 'all'

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteReview(pendingDelete.id)
      await revalidateReviews()
      toast.success('Review deleted', { description: pendingDelete.title })
    } catch {
      toast.error('Could not delete review')
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Workspace"
        title="Review History"
        description="Every review is saved in this browser. Open one to continue fixing findings or export its report."
        actions={
          <Button render={<Link href="/review/new" />} nativeButton={false}>
            <FilePlus2 aria-hidden="true" />
            New Content Review
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_180px]">
        <div className="relative">
          <Label htmlFor="history-search" className="sr-only">
            Search reviews
          </Label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="history-search"
            type="search"
            placeholder="Search by title, product, or content"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select items={statusItems} value={status} onValueChange={(v) => v && setStatus(v)}>
          <SelectTrigger className="w-full" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusItems.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select items={riskItems} value={risk} onValueChange={(v) => v && setRisk(v)}>
          <SelectTrigger className="w-full" aria-label="Filter by risk">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {riskItems.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        <div className="hidden grid-cols-[minmax(0,1fr)_120px_90px_110px_170px_40px] gap-4 border-b bg-muted/50 px-5 py-2.5 text-xs font-medium text-muted-foreground md:grid">
          <span>Review</span>
          <span>Created</span>
          <span>Findings</span>
          <span>Highest</span>
          <span>Status</span>
          <span className="sr-only">Actions</span>
        </div>

        {error ? (
          <p className="px-5 py-10 text-center text-sm text-danger">Reviews could not be loaded from local storage.</p>
        ) : isLoading ? (
          <div className="flex flex-col gap-3 p-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Inbox className="size-5 text-muted-foreground" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-foreground">
              {hasFilters ? 'No reviews match these filters' : 'No reviews yet'}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {hasFilters
                ? 'Try a different search term or clear the filters.'
                : 'Analyze your first piece of marketing content to see it here.'}
            </p>
            {hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('')
                  setStatus('all')
                  setRisk('all')
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button render={<Link href="/review/new" />} nativeButton={false}>
                New Content Review
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y">
            <AnimatePresence initial={false}>
              {filtered.map((r) => {
                const highest = highestSeverity(r.findings)
                return (
                  <motion.li
                    key={r.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative grid grid-cols-[minmax(0,1fr)_40px] items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-muted/50 md:grid-cols-[minmax(0,1fr)_120px_90px_110px_170px_40px]"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/reviews/${r.id}`}
                        className="block truncate text-sm font-medium text-foreground outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {r.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.brandName} · {r.productName}
                      </p>
                    </div>
                    <span className="hidden text-sm text-muted-foreground md:block">{formatDate(r.createdAt)}</span>
                    <span className="hidden text-sm tabular-nums text-foreground md:block">{r.findings.length}</span>
                    <span className="hidden md:block">
                      {highest === 'none' ? <span className="text-sm text-muted-foreground">None</span> : <SeverityBadge severity={highest} />}
                    </span>
                    <div className="col-start-1 row-start-2 flex flex-wrap items-center gap-1.5 md:col-start-auto md:row-start-auto">
                      <ReviewStatusBadge status={reviewStatus(r)} />
                      <span className="md:hidden">
                        <RiskBadge risk={reviewRisk(r)} />
                      </span>
                      <span className="text-xs text-muted-foreground md:hidden">
                        {r.findings.length} findings · {formatDate(r.createdAt)}
                      </span>
                    </div>
                    <div className="relative z-10 col-start-2 row-span-2 row-start-1 flex justify-end md:col-start-auto md:row-span-1 md:row-start-auto">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${r.title}`}
                        onClick={() => setPendingDelete(r)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </Card>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${pendingDelete?.title ?? ''}" and its findings will be removed from this browser. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}
