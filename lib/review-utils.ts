import type { Finding, Review, ReviewStatus, RiskLevel, Severity, TextEdit } from './types'

const severityRank: Record<Severity, number> = { high: 3, medium: 2, low: 1 }

export function unresolved(findings: Finding[]) {
  return findings.filter((f) => f.status !== 'fixed')
}

export function highestSeverity(findings: Finding[]): RiskLevel {
  let best: RiskLevel = 'none'
  for (const f of findings) {
    if (best === 'none' || severityRank[f.severity] > severityRank[best as Severity]) best = f.severity
  }
  return best
}

export function reviewRisk(review: Review): RiskLevel {
  return highestSeverity(unresolved(review.findings))
}

export function reviewStatus(review: Review): ReviewStatus {
  const open = unresolved(review.findings)
  if (open.length === 0) return review.approved ? 'approved' : 'ready'
  if (open.some((f) => f.status === 'open' && f.severity === 'high')) return 'changes-required'
  return 'in-review'
}

export interface Segment {
  text: string
  kind: 'same' | 'removed' | 'added'
}

/**
 * Applies edits to the ORIGINAL text in position order, skipping overlaps, so
 * fixes compose regardless of the order in which they were applied.
 */
export function applyEdits(original: string, edits: TextEdit[]) {
  const sorted = [...edits].sort((a, b) => a.start - b.start || b.end - a.end)
  const segments: Segment[] = []
  let cursor = 0
  for (const edit of sorted) {
    if (edit.start < cursor) continue
    if (edit.start > cursor) segments.push({ text: original.slice(cursor, edit.start), kind: 'same' })
    const removed = original.slice(edit.start, edit.end)
    if (removed) segments.push({ text: removed, kind: 'removed' })
    if (edit.replacement) segments.push({ text: edit.replacement, kind: 'added' })
    cursor = edit.end
  }
  if (cursor < original.length) segments.push({ text: original.slice(cursor), kind: 'same' })
  const corrected = segments
    .filter((s) => s.kind !== 'removed')
    .map((s) => s.text)
    .join('')
    .trim()
  return { segments, corrected }
}

export function fixedEdits(review: Review) {
  return review.findings.filter((f) => f.status === 'fixed').flatMap((f) => f.edits)
}

export function correctedText(review: Review) {
  return applyEdits(review.content, fixedEdits(review))
}

export const categoryLabel: Record<Finding['category'], string> = {
  'brand-consistency': 'Brand consistency',
  'product-fact': 'Product fact mismatch',
  price: 'Price mismatch',
  'expired-offer': 'Expired offer',
  'unapproved-offer': 'Unapproved offer',
  'unsupported-claim': 'Unsupported claim',
}
