'use client'

import type { Finding } from '@/lib/types'
import { categoryLabel } from '@/lib/review-utils'
import { cn } from '@/lib/utils'

function markClass(f: Finding, selected: boolean) {
  if (f.status === 'fixed')
    return cn(
      'bg-success-soft text-success line-through decoration-success/50 decoration-1',
      selected && 'ring-2 ring-success/40',
    )
  const tone =
    f.severity === 'high'
      ? 'bg-danger-soft decoration-danger text-foreground'
      : f.severity === 'medium'
        ? 'bg-warning-soft decoration-warning text-foreground'
        : 'bg-info-soft decoration-primary text-foreground'
  return cn(
    tone,
    'underline underline-offset-4 decoration-2',
    f.status === 'needs-verification' && 'decoration-dashed',
    selected && 'ring-2 ring-primary/50',
  )
}

export function HighlightedContent({
  content,
  findings,
  selectedId,
  onSelect,
}: {
  content: string
  findings: Finding[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const ordered = [...findings].sort((a, b) => a.span.start - b.span.start)
  const parts: React.ReactNode[] = []
  let cursor = 0
  for (const f of ordered) {
    if (f.span.start < cursor) continue
    if (f.span.start > cursor) parts.push(content.slice(cursor, f.span.start))
    const selected = f.id === selectedId
    parts.push(
      <button
        key={f.id}
        type="button"
        onClick={() => onSelect(f.id)}
        aria-pressed={selected}
        aria-label={`${categoryLabel[f.category]}: ${content.slice(f.span.start, f.span.end)}`}
        className={cn(
          'inline rounded-[3px] px-0.5 text-left transition-shadow outline-none [box-decoration-break:clone] focus-visible:ring-2 focus-visible:ring-ring',
          markClass(f, selected),
        )}
      >
        {content.slice(f.span.start, f.span.end)}
      </button>,
    )
    cursor = f.span.end
  }
  if (cursor < content.length) parts.push(content.slice(cursor))

  return <p className="text-[15px] leading-8 whitespace-pre-wrap text-pretty text-foreground">{parts}</p>
}
