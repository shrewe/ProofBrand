'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, FlaskConical, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { GuidelineDialog, type EditTarget } from './guideline-dialogs'
import { revalidateGuidelines, useGuidelines } from '@/lib/hooks'
import { deleteGuidelineRecord, resetGuidelines } from '@/lib/services'
import { formatDate, formatINR, toISODate } from '@/lib/format'
import type { Guidelines } from '@/lib/types'
import { cn } from '@/lib/utils'

const TABS = ['products', 'rules', 'offers', 'sources'] as const
type Tab = (typeof TABS)[number]

type PendingDelete = { kind: 'products' | 'rules' | 'offers'; id: string; name: string }

function RowActions({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button variant="ghost" size="icon-sm" aria-label={`Edit ${label}`} onClick={onEdit}>
        <Pencil aria-hidden="true" />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={`Delete ${label}`} onClick={onDelete}>
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  )
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
    </div>
  )
}

function sourceLabel(g: Guidelines, id: string) {
  return g.sources.find((s) => s.id === id)?.label ?? 'Unlinked source'
}

const listMotion = {
  initial: 'hidden',
  animate: 'show',
  variants: { show: { transition: { staggerChildren: 0.04 } } },
}
const itemMotion = { variants: { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } } }

export function GuidelinesView() {
  const router = useRouter()
  const params = useSearchParams()
  const initial = params.get('tab')
  const [tab, setTab] = useState<Tab>(TABS.includes(initial as Tab) ? (initial as Tab) : 'products')
  const { data: g, isLoading } = useGuidelines()
  const [editing, setEditing] = useState<EditTarget | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const today = toISODate(new Date())

  function changeTab(value: Tab) {
    setTab(value)
    router.replace(`/guidelines?tab=${value}`, { scroll: false })
  }

  async function doDelete() {
    if (!pendingDelete) return
    try {
      await deleteGuidelineRecord(pendingDelete.kind, pendingDelete.id)
      await revalidateGuidelines()
      toast.success('Record deleted', { description: pendingDelete.name })
    } catch {
      toast.error('Could not delete record')
    } finally {
      setPendingDelete(null)
    }
  }

  async function doReset() {
    await resetGuidelines()
    await revalidateGuidelines()
    setConfirmReset(false)
    toast.success('Sample guidelines restored')
  }

  const addable = tab !== 'sources'

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Source of truth"
        title="Brand Guidelines"
        description="Approved facts, rules, and offers that every content review is checked against."
        actions={
          <>
            <Button variant="outline" onClick={() => setConfirmReset(true)}>
              <RotateCcw aria-hidden="true" />
              Reset sample data
            </Button>
            {addable && (
              <Button onClick={() => setEditing({ kind: tab, record: null } as EditTarget)}>
                <Plus aria-hidden="true" />
                Add {tab === 'products' ? 'product' : tab === 'rules' ? 'rule' : 'offer'}
              </Button>
            )}
          </>
        }
      />

      <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-foreground">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        <p>
          <span className="font-medium">Sample data.</span>{' '}
          <span className="text-muted-foreground">
            NovaTech records are seeded for this demo. Edits are stored only in this browser.
          </span>
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => changeTab(v as Tab)}>
        <TabsList className="mb-4 w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="products">Product Facts</TabsTrigger>
          <TabsTrigger value="rules">Brand Rules</TabsTrigger>
          <TabsTrigger value="offers">Promotional Offers</TabsTrigger>
          <TabsTrigger value="sources">Evidence Sources</TabsTrigger>
        </TabsList>

        {isLoading || !g ? (
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="products">
              <motion.ul className="grid gap-3" {...listMotion}>
                {g.products.map((p) => (
                  <motion.li key={p.id} {...itemMotion}>
                    <Card className="gap-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{p.name}</h3>
                          <p className="text-xs text-muted-foreground">{sourceLabel(g, p.sourceId)}</p>
                        </div>
                        <RowActions
                          label={p.name}
                          onEdit={() => setEditing({ kind: 'products', record: p })}
                          onDelete={() => setPendingDelete({ kind: 'products', id: p.id, name: p.name })}
                        />
                      </div>
                      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <Meta label="Approved price">
                          <span className="font-semibold tabular-nums">{formatINR(p.price)}</span>
                        </Meta>
                        <Meta label="Battery claim">
                          <span className="sm:line-clamp-2">{p.batteryClaim}</span>
                        </Meta>
                        <Meta label="Battery hours">{p.batteryHours > 0 ? `${p.batteryHours} h` : 'N/A'}</Meta>
                        <Meta label="Last updated">{formatDate(p.updatedAt)}</Meta>
                      </dl>
                    </Card>
                  </motion.li>
                ))}
                {g.products.length === 0 && <EmptyRow text="No product facts. Add one to enable spec and price checks." />}
              </motion.ul>
            </TabsContent>

            <TabsContent value="rules">
              <motion.ul className="grid gap-3" {...listMotion}>
                {g.rules.map((r) => (
                  <motion.li key={r.id} {...itemMotion}>
                    <Card className="gap-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{r.title}</h3>
                          <p className="text-sm text-muted-foreground">{r.description}</p>
                        </div>
                        <RowActions
                          label={r.title}
                          onEdit={() => setEditing({ kind: 'rules', record: r })}
                          onDelete={() => setPendingDelete({ kind: 'rules', id: r.id, name: r.title })}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded-md border border-success/25 bg-success-soft px-2 py-0.5 font-medium text-success">
                          Use: {r.approved}
                        </span>
                        {r.disallowed.map((d) => (
                          <span key={d} className="rounded-md border border-danger/20 bg-danger-soft px-2 py-0.5 text-danger line-through decoration-danger/60">
                            <span className="sr-only">Do not use: </span>
                            {d}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {sourceLabel(g, r.sourceId)} · Updated {formatDate(r.updatedAt)}
                      </p>
                    </Card>
                  </motion.li>
                ))}
                {g.rules.length === 0 && <EmptyRow text="No brand rules. Add one to enable terminology checks." />}
              </motion.ul>
            </TabsContent>

            <TabsContent value="offers">
              <motion.ul className="grid gap-3" {...listMotion}>
                {g.offers.map((o) => {
                  const active = o.validFrom <= today && o.validUntil >= today
                  const upcoming = o.validFrom > today
                  const product = g.products.find((p) => p.id === o.productId)
                  return (
                    <motion.li key={o.id} {...itemMotion}>
                      <Card className="gap-3 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{o.name}</h3>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium',
                                active
                                  ? 'border-success/20 bg-success-soft text-success'
                                  : upcoming
                                    ? 'border-primary/20 bg-info-soft text-primary'
                                    : 'border-danger/20 bg-danger-soft text-danger',
                              )}
                            >
                              <CalendarClock className="size-3.5" aria-hidden="true" />
                              {active ? 'Active' : upcoming ? 'Scheduled' : 'Expired'}
                            </span>
                          </div>
                          <RowActions
                            label={o.name}
                            onEdit={() => setEditing({ kind: 'offers', record: o })}
                            onDelete={() => setPendingDelete({ kind: 'offers', id: o.id, name: o.name })}
                          />
                        </div>
                        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <Meta label="Discount">
                            <span className="font-semibold">{o.discountPercent}% off</span>
                          </Meta>
                          <Meta label="Applies to">{product?.name ?? 'All products'}</Meta>
                          <Meta label="Valid from">{formatDate(o.validFrom)}</Meta>
                          <Meta label="Valid until">{formatDate(o.validUntil)}</Meta>
                        </dl>
                      </Card>
                    </motion.li>
                  )
                })}
                {g.offers.length === 0 && <EmptyRow text="No offers on record. Any promotion in content will be flagged." />}
              </motion.ul>
            </TabsContent>

            <TabsContent value="sources">
              <motion.ul className="grid gap-3 md:grid-cols-2" {...listMotion}>
                {g.sources.map((s) => {
                  const values =
                    s.type === 'Product facts'
                      ? g.products.filter((p) => p.sourceId === s.id).map((p) => `${p.name}: ${formatINR(p.price)} · ${p.batteryClaim}`)
                      : s.type === 'Brand rule'
                        ? g.rules.filter((r) => r.sourceId === s.id).map((r) => `${r.title}: ${r.approved}`)
                        : g.offers.filter((o) => o.sourceId === s.id).map((o) => `${o.name}: ${o.discountPercent}% off until ${formatDate(o.validUntil)}`)
                  return (
                    <motion.li key={s.id} {...itemMotion} className="h-full">
                      <Card className="h-full gap-3 p-5">
                        <div>
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{s.type}</p>
                          <h3 className="mt-0.5 font-semibold text-foreground">{s.label}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                        </div>
                        <ul className="flex flex-col gap-1.5 rounded-lg bg-muted/60 p-3 text-sm text-foreground">
                          {values.length ? values.map((v) => <li key={v}>{v}</li>) : <li className="text-muted-foreground">No linked records.</li>}
                        </ul>
                        <p className="text-xs text-muted-foreground">
                          Owner: {s.owner} · Updated {formatDate(s.updatedAt)}
                        </p>
                      </Card>
                    </motion.li>
                  )
                })}
              </motion.ul>
            </TabsContent>
          </>
        )}
      </Tabs>

      {g && <GuidelineDialog target={editing} guidelines={g} onClose={() => setEditing(null)} />}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${pendingDelete?.name ?? ''}" will no longer be used as evidence in new reviews. Existing reviews keep their findings.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={doDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore sample guidelines?</AlertDialogTitle>
            <AlertDialogDescription>
              All product facts, rules, and offers return to the seeded NovaTech data. Your edits will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doReset}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</li>
}
