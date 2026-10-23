'use client'

import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const SCAN_STEPS = [
  'Parsing content',
  'Brand terminology',
  'Product facts and specifications',
  'Prices and approved offers',
  'Unsupported or comparative claims',
]

export function ScanProgress({ step }: { step: number }) {
  return (
    <div className="w-full max-w-xs rounded-xl border bg-card p-5 shadow-lg" role="status" aria-live="polite">
      <p className="mb-1 text-sm font-semibold">Checking against approved evidence</p>
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(100, ((step + 1) / SCAN_STEPS.length) * 100)}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <ol className="flex flex-col gap-2">
        {SCAN_STEPS.map((label, i) => {
          const done = i < step
          const active = i === step
          return (
            <li
              key={label}
              className={cn(
                'flex items-center gap-2.5 text-sm transition-colors',
                done ? 'text-foreground' : active ? 'text-foreground' : 'text-muted-foreground/70',
              )}
            >
              <span
                className={cn(
                  'flex size-4.5 shrink-0 items-center justify-center rounded-full border',
                  done && 'border-success bg-success text-success-foreground',
                  active && 'border-primary text-primary',
                )}
                aria-hidden="true"
              >
                {done ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : active ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : null}
              </span>
              {label}
              {active && <span className="sr-only">(in progress)</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
