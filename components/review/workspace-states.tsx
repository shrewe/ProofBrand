import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/page-header'

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} aria-hidden="true" />
}

export function WorkspaceSkeleton() {
  return (
    <PageContainer className="max-w-7xl" >
      <span className="sr-only" role="status">
        Loading review…
      </span>
      <Skeleton className="mb-6 h-4 w-28" />
      <Skeleton className="mb-2 h-5 w-40" />
      <Skeleton className="mb-6 h-8 w-80 max-w-full" />
      <Skeleton className="h-20 w-full" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        <Skeleton className="h-72" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </PageContainer>
  )
}

export function ReviewNotFound() {
  return (
    <PageContainer>
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="size-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold">Review not found</h1>
        <p className="text-sm text-muted-foreground">
          This review may have been deleted, or it was created in a different browser.
        </p>
        <div className="mt-2 flex gap-2">
          <Button variant="outline" render={<Link href="/reviews" />} nativeButton={false}>
            Review history
          </Button>
          <Button render={<Link href="/review/new" />} nativeButton={false}>
            New review
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}
