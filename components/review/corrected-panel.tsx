'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Segment } from '@/lib/review-utils'
import { cn } from '@/lib/utils'

export function DiffText({ segments }: { segments: Segment[] }) {
  return (
    <p className="text-[15px] leading-8 whitespace-pre-wrap text-pretty">
      {segments.map((s, i) =>
        s.kind === 'same' ? (
          <span key={i}>{s.text}</span>
        ) : s.kind === 'removed' ? (
          <del key={i} className="rounded-[3px] bg-danger-soft px-0.5 text-danger decoration-danger/60">
            <span className="sr-only">Removed: </span>
            {s.text}
          </del>
        ) : (
          <ins key={i} className="rounded-[3px] bg-success-soft px-0.5 text-success no-underline">
            <span className="sr-only">Added: </span>
            {s.text}
          </ins>
        ),
      )}
    </p>
  )
}

export function CorrectedPanel({
  corrected,
  segments,
  fixedCount,
}: {
  corrected: string
  segments: Segment[]
  fixedCount: number
}) {
  const [view, setView] = useState<'changes' | 'clean'>('changes')
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(corrected)
      setCopied(true)
      toast.success('Corrected copy copied to clipboard')
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Could not access the clipboard')
    }
  }

  return (
    <section aria-labelledby="corrected-heading" className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <div>
          <h2 id="corrected-heading" className="text-sm font-semibold">
            Corrected version
          </h2>
          <p className="text-xs text-muted-foreground">
            {fixedCount === 0 ? 'Apply fixes to build a corrected version.' : `${fixedCount} fix${fixedCount === 1 ? '' : 'es'} applied`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as 'changes' | 'clean')}>
            <TabsList>
              <TabsTrigger value="changes">Changes</TabsTrigger>
              <TabsTrigger value="clean">Clean</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" variant="outline" onClick={copy} disabled={!corrected}>
            {copied ? <Check data-icon="inline-start" aria-hidden="true" /> : <Copy data-icon="inline-start" aria-hidden="true" />}
            Copy
          </Button>
        </div>
      </div>
      <div className={cn('px-5 py-4', fixedCount === 0 && 'text-muted-foreground')}>
        {view === 'changes' ? (
          <DiffText segments={segments} />
        ) : (
          <p className="text-[15px] leading-8 whitespace-pre-wrap text-pretty">{corrected || '—'}</p>
        )}
      </div>
    </section>
  )
}
