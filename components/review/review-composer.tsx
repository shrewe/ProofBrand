'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, Loader2, ScanSearch, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useGuidelines, revalidateReviews } from '@/lib/hooks'
import { SAMPLE_CONTENT } from '@/lib/seed'
import { createReview } from '@/lib/services'
import { formatINR } from '@/lib/format'
import { ScanProgress, SCAN_STEPS } from './scan-progress'

const MAX_CHARS = 5000

export function ReviewComposer() {
  const router = useRouter()
  const { data: guidelines, isLoading } = useGuidelines()
  const [title, setTitle] = useState('')
  const [brandId, setBrandId] = useState('novatech')
  const [productId, setProductId] = useState('novabuds')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [scanStep, setScanStep] = useState<number | null>(null)

  const brandItems = useMemo(
    () => guidelines?.brands.map((b) => ({ value: b.id, label: b.name })) ?? [],
    [guidelines],
  )
  const productItems = useMemo(
    () =>
      guidelines?.products
        .filter((p) => p.brandId === brandId)
        .map((p) => ({ value: p.id, label: p.name })) ?? [],
    [guidelines, brandId],
  )
  const product = guidelines?.products.find((p) => p.id === productId)
  const scanning = scanStep !== null

  function loadSample() {
    setBrandId('novatech')
    setProductId('novabuds')
    setTitle('NovaBuds — launch announcement')
    setContent(SAMPLE_CONTENT)
    setError(null)
  }

  async function analyze() {
    if (!content.trim()) {
      setError('Paste the marketing copy you want to review.')
      return
    }
    if (!productId) {
      setError('Select the product this content is about.')
      return
    }
    setError(null)
    try {
      for (let i = 0; i < SCAN_STEPS.length; i++) {
        setScanStep(i)
        await new Promise((r) => setTimeout(r, 340))
      }
      const review = await createReview({ title, brandId, productId, content })
      await revalidateReviews()
      setScanStep(SCAN_STEPS.length)
      toast.success('Analysis complete', {
        description: `${review.findings.length} finding${review.findings.length === 1 ? '' : 's'} linked to approved evidence.`,
      })
      router.push(`/reviews/${review.id}`)
    } catch (e) {
      setScanStep(null)
      toast.error('Analysis failed', { description: e instanceof Error ? e.message : 'Please try again.' })
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="relative gap-0 overflow-hidden p-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            analyze()
          }}
          className="flex flex-col"
          aria-busy={scanning}
        >
          <div className="grid gap-4 border-b p-5 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5 sm:col-span-3">
              <Label htmlFor="review-title">Review title</Label>
              <Input
                id="review-title"
                placeholder="e.g. NovaBuds — launch announcement"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={scanning}
                maxLength={120}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="brand">Brand</Label>
              <Select
                items={brandItems}
                value={brandId}
                onValueChange={(v) => {
                  if (!v) return
                  setBrandId(v)
                  const first = guidelines?.products.find((p) => p.brandId === v)
                  setProductId(first?.id ?? '')
                }}
                disabled={scanning || isLoading}
              >
                <SelectTrigger id="brand" className="w-full">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brandItems.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="product">Product</Label>
              <Select
                items={productItems}
                value={productId}
                onValueChange={(v) => v && setProductId(v)}
                disabled={scanning || isLoading}
              >
                <SelectTrigger id="product" className="w-full">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {productItems.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative p-5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <Label htmlFor="content">Marketing content</Label>
              <Button type="button" variant="ghost" size="sm" onClick={loadSample} disabled={scanning}>
                <Sparkles data-icon="inline-start" aria-hidden="true" />
                Load sample
              </Button>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => {
                setContent(e.target.value.slice(0, MAX_CHARS))
                if (error) setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return
                  e.preventDefault()
                  analyze()
                }
              }}
              placeholder="Paste an ad, caption, email, or product description…"
              className="min-h-56 resize-y text-[15px] leading-relaxed"
              disabled={scanning}
              aria-invalid={!!error}
              aria-describedby={error ? 'content-error' : 'content-hint'}
            />
            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
              {error ? (
                <p id="content-error" className="text-destructive" role="alert">
                  {error}
                </p>
              ) : (
                <p id="content-hint" className="text-muted-foreground">
                  Press <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">Ctrl</kbd> +{' '}
                  <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">Enter</kbd> to analyze
                </p>
              )}
              <span className="tabular-nums text-muted-foreground">
                {content.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>

            <AnimatePresence>
              {scanning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-card/85 backdrop-blur-[2px]"
                >
                  <ScanProgress step={scanStep ?? 0} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Checks run against approved records only. Nothing is published.
            </p>
            <Button type="submit" disabled={scanning || isLoading} className="sm:min-w-40">
              {scanning ? (
                <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
              ) : (
                <ScanSearch data-icon="inline-start" aria-hidden="true" />
              )}
              {scanning ? 'Analyzing…' : 'Analyze content'}
            </Button>
          </div>
        </form>
      </Card>

      <aside aria-label="Approved evidence in scope" className="flex flex-col gap-4">
        <Card className="gap-3 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileText className="size-4 text-primary" aria-hidden="true" />
            Evidence in scope
          </div>
          {product ? (
            <dl className="grid gap-2.5 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Product</dt>
                <dd className="font-medium">{product.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Approved price</dt>
                <dd className="font-medium tabular-nums">{formatINR(product.price)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Battery</dt>
                <dd>{product.batteryClaim}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Brand rules</dt>
                <dd>{guidelines?.rules.filter((r) => r.brandId === brandId).length ?? 0} active</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Offer records</dt>
                <dd>
                  {guidelines?.offers.filter(
                    (o) => o.brandId === brandId && (o.productId === null || o.productId === productId),
                  ).length ?? 0}{' '}
                  on file
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Select a product to see its approved facts.</p>
          )}
        </Card>
        <Card className="gap-2 p-4 text-sm">
          <p className="font-medium">What gets checked</p>
          <ul className="flex flex-col gap-1.5 text-muted-foreground">
            {SCAN_STEPS.slice(1).map((s) => (
              <li key={s} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {s}
              </li>
            ))}
          </ul>
        </Card>
      </aside>
    </div>
  )
}
