'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MotionConfig, motion } from 'framer-motion'
import {
  FilePlus2,
  History,
  LayoutDashboard,
  Menu,
  BookCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from 'lucide-react'
import { Logo, LogoMark } from '@/components/brand/logo'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, match: (p: string) => p === '/' },
  { href: '/review/new', label: 'New Content Review', icon: FilePlus2, match: (p: string) => p.startsWith('/review/new') },
  { href: '/guidelines', label: 'Brand Guidelines', icon: BookCheck, match: (p: string) => p.startsWith('/guidelines') },
  { href: '/reviews', label: 'Review History', icon: History, match: (p: string) => p.startsWith('/reviews') },
]

function NavLinks({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {nav.map((item) => {
        const active = item.match(pathname)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              'group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-sidebar-primary"
                aria-hidden="true"
              />
            )}
            <Icon className={cn('size-4 shrink-0', active && 'text-sidebar-primary')} aria-hidden="true" />
            <span className={cn('truncate', collapsed && 'sr-only')}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function ProfileCard({ collapsed, email, onSignOut }: { collapsed?: boolean; email?: string | null; onSignOut: () => void }) {
  const initials = email?.trim()?.[0]?.toUpperCase() || 'P'
  return (
    <div className={cn('flex items-center gap-2.5 rounded-lg border border-sidebar-border p-2', collapsed && 'justify-center border-transparent p-0')}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground" aria-hidden="true">{initials}</div>
      <div className={cn('min-w-0 flex-1 leading-tight', collapsed && 'sr-only')}>
        <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{email ? email.split('@')[0] : 'ProofBrand user'}</p>
        <p className="truncate text-xs text-sidebar-muted">{email || 'Signed-in workspace'}</p>
      </div>
      <button type="button" onClick={onSignOut} title="Sign out" aria-label="Sign out" className={cn('flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}>
        <LogOut className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    try {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null)).catch(() => setEmail(null))
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user.email ?? null))
      return () => listener.subscription.unsubscribe()
    } catch {
      setEmail(null)
    }
  }, [])

  async function signOut() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      window.location.assign('/login')
    }
  }

  if (pathname.startsWith('/login')) return <>{children}<Toaster position="bottom-right" richColors closeButton /></>

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh">
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 72 : 256 }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          className="sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground lg:flex print:hidden"
        >
          <div className={cn('flex h-16 items-center px-4', collapsed && 'justify-center px-0')}>
            {collapsed ? <LogoMark /> : <Logo />}
          </div>
          <div className="flex flex-1 flex-col gap-6 px-3 py-4">
            <NavLinks collapsed={collapsed} />
          </div>
          <div className="flex flex-col gap-3 border-t border-sidebar-border p-3">
            <ProfileCard collapsed={collapsed} email={email} onSignOut={signOut} />
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              className={cn(
                'flex h-8 items-center gap-2 rounded-md px-2 text-xs text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-none',
                collapsed && 'justify-center',
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" aria-hidden="true" />
              ) : (
                <>
                  <PanelLeftClose className="size-4" aria-hidden="true" />
                  Collapse
                </>
              )}
            </button>
          </div>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden print:hidden">
            <Link href="/" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
              <Logo showAttribution={false} />
              <span className="sr-only">ProofBrand home</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="flex size-9 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-none"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </header>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent
              side="left"
              className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&_[data-slot=sheet-close]]:text-sidebar-foreground"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-16 items-center px-4">
                <Logo />
              </div>
              <div className="flex-1 px-3 py-2">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="border-t border-sidebar-border p-3">
                <ProfileCard email={email} onSignOut={signOut} />
              </div>
            </SheetContent>
          </Sheet>

          <main className="flex-1">{children}</main>
        </div>
      </div>
      <Toaster position="bottom-right" richColors closeButton />
    </MotionConfig>
  )
}
