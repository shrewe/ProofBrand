import {
  AlertOctagon,
  AlertTriangle,
  BadgeCheck,
  CircleCheck,
  CircleDot,
  Clock,
  HelpCircle,
  Info,
  ShieldCheck,
} from 'lucide-react'
import type { FindingStatus, ReviewStatus, RiskLevel, Severity } from '@/lib/types'
import { cn } from '@/lib/utils'

const base =
  'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0'

const tone = {
  danger: 'border-danger/20 bg-danger-soft text-danger',
  warning: 'border-warning/25 bg-warning-soft text-warning',
  success: 'border-success/20 bg-success-soft text-success',
  info: 'border-primary/20 bg-info-soft text-primary',
  neutral: 'border-border bg-muted text-muted-foreground',
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const map = {
    high: { t: tone.danger, icon: AlertOctagon, label: 'High' },
    medium: { t: tone.warning, icon: AlertTriangle, label: 'Medium' },
    low: { t: tone.info, icon: Info, label: 'Low' },
  }[severity]
  const Icon = map.icon
  return (
    <span className={cn(base, map.t, className)}>
      <Icon aria-hidden="true" />
      {map.label}
      <span className="sr-only"> severity</span>
    </span>
  )
}

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  if (risk === 'none')
    return (
      <span className={cn(base, tone.success, className)}>
        <ShieldCheck aria-hidden="true" />
        No open risk
      </span>
    )
  const map = {
    high: { t: tone.danger, icon: AlertOctagon, label: 'High risk' },
    medium: { t: tone.warning, icon: AlertTriangle, label: 'Medium risk' },
    low: { t: tone.info, icon: Info, label: 'Low risk' },
  }[risk]
  const Icon = map.icon
  return (
    <span className={cn(base, map.t, className)}>
      <Icon aria-hidden="true" />
      {map.label}
    </span>
  )
}

export function FindingStatusBadge({ status, className }: { status: FindingStatus; className?: string }) {
  const map = {
    open: { t: tone.neutral, icon: CircleDot, label: 'Open' },
    fixed: { t: tone.success, icon: CircleCheck, label: 'Fixed' },
    'needs-verification': { t: tone.warning, icon: HelpCircle, label: 'Needs verification' },
  }[status]
  const Icon = map.icon
  return (
    <span className={cn(base, map.t, className)}>
      <Icon aria-hidden="true" />
      {map.label}
    </span>
  )
}

export const reviewStatusLabel: Record<ReviewStatus, string> = {
  approved: 'Approved',
  ready: 'Ready for approval',
  'changes-required': 'Changes required',
  'in-review': 'In review',
}

export function ReviewStatusBadge({ status, className }: { status: ReviewStatus; className?: string }) {
  const map = {
    approved: { t: tone.success, icon: BadgeCheck },
    ready: { t: tone.info, icon: CircleCheck },
    'changes-required': { t: tone.danger, icon: AlertOctagon },
    'in-review': { t: tone.warning, icon: Clock },
  }[status]
  const Icon = map.icon
  return (
    <span className={cn(base, map.t, className)}>
      <Icon aria-hidden="true" />
      {reviewStatusLabel[status]}
    </span>
  )
}
