'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertOctagon,
  ArrowRight,
  BadgeCheck,
  BookCheck,
  ClipboardList,
  Clock,
  FilePlus2,
  Link2,
  Package,
  ScrollText,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageContainer, PageHeader } from '@/components/page-header'
import { RiskBadge, ReviewStatusBadge } from '@/components/status-badges'
import { useGuidelines, useReviews } from '@/lib/hooks'
import { reviewRisk, reviewStatus, unresolved } from '@/lib/review-utils'
import { formatDate, toISODate } from '@/lib/format'
import { cn } from '@/lib/utils'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export function OverviewDashboard() {
  const { data: reviews, isLoading } = useReviews()
  const { data: guidelines } = useGuidelines()

  const list = reviews ?? []
  const statuses = list.map(reviewStatus)
  const highRisk = list.reduce(
    (n, r) => n + unresolved(r.findings).filter((f) => f.severity === 'high').length,
    0,
  )
  const pending = statuses.filter((s) => s === 'changes-required' || s === 'in-review').length
  const ready = statuses.filter((s) => s === 'ready').length

  const stats = [
    { label: 'Total reviews', value: list.length, icon: ClipboardList, href: '/reviews', tone: 'text-primary bg-info-soft' },
    { label: 'High-risk issues', value: highRisk, icon: AlertOctagon, href: '/reviews?risk=high', tone: 'text-danger bg-danger-soft' },
    { label: 'Pending reviews', value: pending, icon: Clock, href: '/reviews?status=pending', tone: 'text-warning bg-warning-soft' },
    { label: 'Ready for approval', value: ready, icon: BadgeCheck, href: '/reviews?status=ready', tone: 'text-success bg-success-soft' },
  ]

  const today = toISODate(new Date())
  const activeOffers = guidelines?.offers.filter((o) => o.validUntil >= today).length ?? 0

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Overview"
        title={`${greeting()}, Brand Reviewer`}
        description="Keep every brand claim accurate, consistent, and evidence-backed."
        actions={
          <Button size="lg" render={<Link href="/review/new" />} nativeButton={false}>
            <FilePlus2 aria-hidden="true" />
            New Content Review
          </Button>
        }
      />

      <motion.ul
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      >
        {stats.map((s) => (
          <motion.li key={s.label} variants={item}>
            <Link
              href={s.href}
              className="group flex h-full flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs transition-colors outline-none hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className={cn('flex size-8 items-center justify-center rounded-lg', s.tone)}>
                  <s.icon className="size-4" aria-hidden="true" />
                </span>
              </div>
              <span className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                {isLoading ? '–' : s.value}
              </span>
            </Link>
          </motion.li>
        ))}
      </motion.ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="gap-0 p-0">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Recent reviews</h2>
            <Button variant="ghost" size="sm" render={<Link href="/reviews" />} nativeButton={false}>
              View all
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-3 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
              <p className="text-sm text-muted-foreground">No reviews yet. Start by reviewing a piece of content.</p>
              <Button render={<Link href="/review/new" />} nativeButton={false}>
                New Content Review
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {list.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/reviews/${r.id}`}
                    className="flex flex-col gap-2 px-5 py-3.5 transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.brandName} · {r.productName} · {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <RiskBadge risk={reviewRisk(r)} />
                      <ReviewStatusBadge status={reviewStatus(r)} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="gap-0 p-0">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Brand guidelines</h2>
              <BookCheck className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <ul className="flex flex-col p-2">
              {[
                { label: 'Product facts', count: guidelines?.products.length, icon: Package, tab: 'products' },
                { label: 'Brand rules', count: guidelines?.rules.length, icon: ScrollText, tab: 'rules' },
                { label: 'Promotional offers', count: guidelines?.offers.length, icon: Tag, tab: 'offers', note: `${activeOffers} active` },
                { label: 'Evidence sources', count: guidelines?.sources.length, icon: Link2, tab: 'sources' },
              ].map((g) => (
                <li key={g.tab}>
                  <Link
                    href={`/guidelines?tab=${g.tab}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none hover:bg-muted focus-visible:bg-muted"
                  >
                    <g.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span className="flex-1 text-foreground">{g.label}</span>
                    {g.note && <span className="text-xs text-muted-foreground">{g.note}</span>}
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                      {g.count ?? '–'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <div className="rounded-xl border border-primary/15 bg-info-soft p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Link2 className="size-4 text-primary" aria-hidden="true" />
              Evidence-linked findings
            </div>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
              Every finding cites the approved fact, rule, or offer record it was checked against. When no approved
              source exists, ProofBrand marks the claim <span className="font-medium text-warning">Needs verification</span>{' '}
              instead of calling it false.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
