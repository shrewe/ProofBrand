'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { CircleHelp, Database, FileSearch, Lightbulb, RotateCcw, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FindingStatusBadge, SeverityBadge } from '@/components/status-badges'
import type { Finding } from '@/lib/types'
import { categoryLabel } from '@/lib/review-utils'
import { cn } from '@/lib/utils'

const verdictLabel: Record<Finding['verdict'], string> = {
  contradicted: 'Contradicts approved record',
  expired: 'Offer expired',
  inconsistent: 'Inconsistent with brand rule',
  unsupported: 'No supporting evidence',
}

export const FindingCard = forwardRef<
  HTMLElement,
  {
    finding: Finding
    selected: boolean
    onSelect: () => void
    onApplyFix: () => void
    onUndo: () => void
    onToggleVerification: () => void
  }
>(function FindingCard({ finding: f, selected, onSelect, onApplyFix, onUndo, onToggleVerification }, ref) {
  const fixed = f.status === 'fixed'
  const accent =
    fixed ? 'before:bg-success' : f.severity === 'high' ? 'before:bg-danger' : f.severity === 'medium' ? 'before:bg-warning' : 'before:bg-primary'

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      aria-labelledby={`${f.id}-title`}
      onClick={onSelect}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-4 pl-5 transition-[box-shadow,border-color] before:absolute before:inset-y-0 before:left-0 before:w-1',
        accent,
        selected ? 'border-primary/40 shadow-md ring-1 ring-primary/20' : 'hover:border-foreground/15',
        fixed && 'bg-card/70',
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={`${f.id}-title`} className="text-sm font-semibold">
            {categoryLabel[f.category]}
          </h3>
          <p className="text-xs text-muted-foreground">{verdictLabel[f.verdict]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <SeverityBadge severity={f.severity} />
          <FindingStatusBadge status={f.status} />
        </div>
      </header>

      <blockquote
        className={cn(
          'mt-3 rounded-md border-l-2 bg-muted/60 px-3 py-2 text-sm',
          fixed ? 'border-success/50 text-muted-foreground line-through' : 'border-foreground/20',
        )}
      >
        “{f.excerpt}”
      </blockquote>

      <p className="mt-3 text-sm text-pretty text-foreground/90">{f.explanation}</p>

      <div className="mt-3 rounded-lg border bg-background p-3">
        {f.evidence ? (
          <>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Database className="size-3.5" aria-hidden="true" />
              Evidence · {f.evidence.sourceLabel}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{f.evidence.recordTitle}</p>
            <p className="mt-1 text-sm font-medium">{f.evidence.approvedValue}</p>
          </>
        ) : (
          <div className="flex gap-2">
            <CircleHelp className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">No approved evidence found</p>
              <p className="text-xs text-muted-foreground">
                This claim is not marked false — it needs verification before it can be published.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 text-sm">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>
          <span className="font-medium">Suggested fix: </span>
          <span className="text-foreground/90">{f.suggestion}</span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        {fixed ? (
          <Button size="sm" variant="outline" onClick={onUndo}>
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
            Undo fix
          </Button>
        ) : (
          <>
            {f.edits.length > 0 && (
              <Button size="sm" onClick={onApplyFix}>
                <Wand2 data-icon="inline-start" aria-hidden="true" />
                Apply fix
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onToggleVerification}>
              <FileSearch data-icon="inline-start" aria-hidden="true" />
              {f.status === 'needs-verification' ? 'Mark as open' : 'Needs verification'}
            </Button>
          </>
        )}
      </div>
    </motion.article>
  )
})
