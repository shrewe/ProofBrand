import { cn } from '@/lib/utils'

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8', className)}>{children}</div>
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-pretty text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
