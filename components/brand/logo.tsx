import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn('size-8', className)}>
      <defs>
        <linearGradient id="pb-shield" x1="6" y1="3" x2="26" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.6 0.2 272)" />
          <stop offset="1" stopColor="oklch(0.42 0.2 272)" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.5 27 6.6V15c0 6.9-4.6 12.1-11 14.5C9.6 27.1 5 21.9 5 15V6.6L16 2.5Z"
        fill="url(#pb-shield)"
      />
      <path
        d="M11.5 23V9h5a4 4 0 0 1 0 8h-5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 12.2h2.2M14.5 14h1.4" stroke="white" strokeOpacity=".55" strokeWidth="1.1" strokeLinecap="round" />
      <path
        d="m15.6 21.1 2.4 2.4 5-5.6"
        stroke="oklch(0.82 0.13 172)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({
  showAttribution = true,
  tone = 'dark',
  className,
}: {
  showAttribution?: boolean
  tone?: 'dark' | 'light'
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="size-8 shrink-0" />
      <div className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            'text-[15px] font-semibold tracking-tight',
            tone === 'dark' ? 'text-sidebar-accent-foreground' : 'text-foreground',
          )}
        >
          ProofBrand
        </span>
        {showAttribution && (
          <span
            className={cn(
              'mt-1 truncate text-[10.5px] italic',
              tone === 'dark' ? 'text-sidebar-muted' : 'text-muted-foreground',
            )}
          >
            A product by NS Technologies
          </span>
        )}
      </div>
    </div>
  )
}
