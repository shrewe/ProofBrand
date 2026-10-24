
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FileText,
  Loader2,
  Plus,
  ScanSearch,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  useGuidelines,
  revalidateGuidelines,
  revalidateReviews,
} from '@/lib/hooks'
import { SAMPLE_CONTENT } from '@/lib/seed'
import {
  createBrand,
  createReview,
  saveProduct,
} from '@/lib/services'
import { formatINR } from '@/lib/format'
import { ScanProgress, SCAN_STEPS } from './scan-progress'

const MAX_CHARS = 5000

export function ReviewComposer() {
  const router = useRouter()
  const {
    data: guidelines,
    isLoading,
    error: guidelinesError,
  } = useGuidelines()

  const [title, setTitle] = useState('')
  const [brandId, setBrandId] = useState('')
  const [productId, setProductId] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [scanStep, setScanStep] = useState<number | null>(null)

  const [showBrandForm, setShowBrandForm] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)

  const [newBrandName, setNewBrandName] = useState('')
  const [newProductName, setNewProductName] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [newBatteryHours, setNewBatteryHours] = useState('')
  const [newBatteryClaim, setNewBatteryClaim] = useState('')

  const [savingRecord, setSavingRecord] = useState(false)

  const brandItems = useMemo(
    () =>
      guidelines?.brands.map((brand) => ({
        value: brand.id,
        label: brand.name,
      })) ?? [],
    [guidelines],
  )

  const productItems = useMemo(
    () =>
      guidelines?.products
        .filter((product) => product.brandId === brandId)
        .map((product) => ({
          value: product.id,
          label: product.name,
        })) ?? [],
    [guidelines, brandId],
  )

  const product = guidelines?.products.find(
    (item) => item.id === productId && item.brandId === brandId,
  )

  const scanning = scanStep !== null
  const busy = scanning || savingRecord

  // Select a real brand and product when data loads.
  // This avoids references to the removed NovaTech demo records.
  useEffect(() => {
    if (!guidelines) return

    const selectedBrandExists = guidelines.brands.some(
      (brand) => brand.id === brandId,
    )

    const nextBrandId = selectedBrandExists
      ? brandId
      : guidelines.brands[0]?.id ?? ''

    if (nextBrandId !== brandId) {
      setBrandId(nextBrandId)
    }

    const productsForBrand = guidelines.products.filter(
      (item) => item.brandId === nextBrandId,
    )

    const selectedProductExists = productsForBrand.some(
      (item) => item.id === productId,
    )

    if (!selectedProductExists) {
      setProductId(productsForBrand[0]?.id ?? '')
    }
  }, [guidelines, brandId, productId])

  async function handleCreateBrand() {
    if (savingRecord || scanning) return

    try {
      setSavingRecord(true)

      const brand = await createBrand(newBrandName)

      // Refresh the SWR cache so the new brand appears in the dropdown.
      await revalidateGuidelines()

      setBrandId(brand.id)
      setProductId('')
      setNewBrandName('')
      setShowBrandForm(false)
      setShowProductForm(false)

      toast.success('Brand added', {
        description: `${brand.name} is now available in your brand list.`,
      })
    } catch (e) {
      toast.error('Could not add brand', {
        description:
          e instanceof Error ? e.message : 'Please try again.',
      })
    } finally {
      setSavingRecord(false)
    }
  }

  async function handleCreateProduct() {
    if (savingRecord || scanning) return

    if (!brandId) {
      toast.error('Select or create a brand first.')
      return
    }

    const price = Number(newProductPrice)
    const batteryHours = Number(newBatteryHours)

    if (!newProductName.trim()) {
      toast.error('Enter a product name.')
      return
    }

    if (
      newProductPrice.trim() === '' ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      toast.error('Enter a valid non-negative price.')
      return
    }

    if (
      newBatteryHours.trim() === '' ||
      !Number.isFinite(batteryHours) ||
      batteryHours < 0
    ) {
      toast.error('Enter valid battery hours.')
      return
    }

    try {
      setSavingRecord(true)

      const savedProduct = await saveProduct({
        brandId,
        name: newProductName.trim(),
        price,
        batteryHours,
        batteryClaim: newBatteryClaim.trim(),
        sourceId: '',
        updatedAt: new Date().toISOString(),
      })

      await revalidateGuidelines()

      setProductId(savedProduct.id)
      setNewProductName('')
      setNewProductPrice('')
      setNewBatteryHours('')
      setNewBatteryClaim('')
      setShowProductForm(false)

      toast.success('Product added', {
        description: `${savedProduct.name} is now available for content reviews.`,
      })
    } catch (e) {
      toast.error('Could not add product', {
        description:
          e instanceof Error ? e.message : 'Please try again.',
      })
    } finally {
      setSavingRecord(false)
    }
  }

  function loadSample() {
    const sampleBrand =
      guidelines?.brands.find((brand) => brand.id === 'novatech') ??
      guidelines?.brands[0]

    const sampleProduct = sampleBrand
      ? guidelines?.products.find(
          (item) => item.brandId === sampleBrand.id,
        )
      : undefined

    if (!sampleBrand || !sampleProduct) {
      toast.error('No product available', {
        description:
          'Add a brand and product before loading sample content.',
      })
      return
    }

    setBrandId(sampleBrand.id)
    setProductId(sampleProduct.id)
    setTitle(`${sampleProduct.name} — launch announcement`)
    setContent(SAMPLE_CONTENT)
    setError(null)
  }

  async function analyze() {
    if (busy) return

    if (!content.trim()) {
      setError('Paste the marketing copy you want to review.')
      return
    }

    if (!brandId) {
      setError('Create or select a brand first.')
      return
    }

    if (!productId) {
      setError('Select a product or add one for this brand.')
      return
    }

    const productBelongsToBrand = guidelines?.products.some(
      (item) => item.id === productId && item.brandId === brandId,
    )

    if (!productBelongsToBrand) {
      setError('Select a product belonging to the chosen brand.')
      return
    }

    setError(null)

    try {
      for (let index = 0; index < SCAN_STEPS.length; index++) {
        setScanStep(index)
        await new Promise((resolve) => setTimeout(resolve, 340))
      }

      const review = await createReview({
        title,
        brandId,
        productId,
        content,
      })

      await revalidateReviews()

      setScanStep(SCAN_STEPS.length)

      toast.success('Analysis complete', {
        description: `${review.findings.length} finding${
          review.findings.length === 1 ? '' : 's'
        } linked to approved evidence.`,
      })

      router.push(`/reviews/${review.id}`)
    } catch (e) {
      setScanStep(null)

      toast.error('Analysis failed', {
        description:
          e instanceof Error ? e.message : 'Please try again.',
      })
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="relative gap-0 overflow-hidden p-0">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void analyze()
          }}
          className="flex flex-col"
          aria-busy={busy}
        >
          <div className="grid gap-4 border-b p-5 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5 sm:col-span-3">
              <Label htmlFor="review-title">Review title</Label>
              <Input
                id="review-title"
                placeholder="e.g. Product launch announcement"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={busy}
                maxLength={120}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="brand">Brand</Label>

              <Select
                items={brandItems}
                value={brandId}
                onValueChange={(value) => {
                  if (!value) return

                  setBrandId(value)

                  const firstProduct = guidelines?.products.find(
                    (item) => item.brandId === value,
                  )

                  setProductId(firstProduct?.id ?? '')
                  setError(null)
                }}
                disabled={busy || isLoading || !!guidelinesError}
              >
                <SelectTrigger id="brand" className="w-full">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>

                <SelectContent>
                  {brandItems.map((brand) => (
                    <SelectItem key={brand.value} value={brand.value}>
                      {brand.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 w-full"
                onClick={() => {
                  setShowBrandForm((show) => !show)
                  setShowProductForm(false)
                }}
                disabled={busy}
              >
                <Plus data-icon="inline-start" aria-hidden="true" />
                Add brand
              </Button>

              {showBrandForm && (
                <div className="mt-2 grid gap-2 rounded-lg border p-3">
                  <Label htmlFor="new-brand-name">New brand name</Label>

                  <Input
                    id="new-brand-name"
                    value={newBrandName}
                    onChange={(event) =>
                      setNewBrandName(event.target.value)
                    }
                    placeholder="e.g. Acme"
                    maxLength={100}
                    disabled={busy}
                  />

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleCreateBrand()}
                    disabled={busy || !newBrandName.trim()}
                  >
                    {savingRecord ? (
                      <Loader2
                        className="mr-2 size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Plus
                        className="mr-2 size-4"
                        aria-hidden="true"
                      />
                    )}
                    Save brand
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="product">Product</Label>

              <Select
                items={productItems}
                value={productId}
                onValueChange={(value) => {
                  if (value) {
                    setProductId(value)
                    setError(null)
                  }
                }}
                disabled={busy || isLoading || !brandId || !!guidelinesError}
              >
                <SelectTrigger id="product" className="w-full">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>

                <SelectContent>
                  {productItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 w-full"
                onClick={() => {
                  setShowProductForm((show) => !show)
                  setShowBrandForm(false)
                }}
                disabled={busy || !brandId}
              >
                <Plus data-icon="inline-start" aria-hidden="true" />
                Add product
              </Button>

              {showProductForm && (
                <div className="mt-2 grid gap-3 rounded-lg border p-3">
                  <p className="text-sm font-medium">
                    New product for{' '}
                    {guidelines?.brands.find(
                      (brand) => brand.id === brandId,
                    )?.name ?? 'selected brand'}
                  </p>

                  <div className="grid gap-1.5">
                    <Label htmlFor="new-product-name">
                      Product name
                    </Label>
                    <Input
                      id="new-product-name"
                      value={newProductName}
                      onChange={(event) =>
                        setNewProductName(event.target.value)
                      }
                      placeholder="e.g. Acme Buds Pro"
                      maxLength={120}
                      disabled={busy}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="new-product-price">
                      Approved price (₹)
                    </Label>
                    <Input
                      id="new-product-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newProductPrice}
                      onChange={(event) =>
                        setNewProductPrice(event.target.value)
                      }
                      placeholder="e.g. 2999"
                      disabled={busy}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="new-battery-hours">
                      Battery life (hours)
                    </Label>
                    <Input
                      id="new-battery-hours"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newBatteryHours}
                      onChange={(event) =>
                        setNewBatteryHours(event.target.value)
                      }
                      placeholder="e.g. 8"
                      disabled={busy}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="new-battery-claim">
                      Approved battery claim
                    </Label>
                    <Input
                      id="new-battery-claim"
                      value={newBatteryClaim}
                      onChange={(event) =>
                        setNewBatteryClaim(event.target.value)
                      }
                      placeholder="e.g. Up to 8 hours per charge"
                      maxLength={250}
                      disabled={busy}
                    />
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleCreateProduct()}
                    disabled={
                      busy ||
                      !newProductName.trim() ||
                      newProductPrice.trim() === '' ||
                      newBatteryHours.trim() === ''
                    }
                  >
                    {savingRecord ? (
                      <Loader2
                        className="mr-2 size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Plus
                        className="mr-2 size-4"
                        aria-hidden="true"
                      />
                    )}
                    Save product
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="relative p-5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <Label htmlFor="content">Marketing content</Label>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadSample}
                disabled={busy}
              >
                <Sparkles data-icon="inline-start" aria-hidden="true" />
                Load sample
              </Button>
            </div>

            <Textarea
              id="content"
              value={content}
              onChange={(event) => {
                setContent(event.target.value.slice(0, MAX_CHARS))
                if (error) setError(null)
              }}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  (event.metaKey || event.ctrlKey)
                ) {
                  if (
                    event.nativeEvent.isComposing ||
                    event.keyCode === 229
                  ) {
                    return
                  }

                  event.preventDefault()
                  void analyze()
                }
              }}
              placeholder="Paste an ad, caption, email, or product description…"
              className="min-h-56 resize-y text-[15px] leading-relaxed"
              disabled={busy}
              aria-invalid={!!error}
              aria-describedby={error ? 'content-error' : 'content-hint'}
            />

            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
              {error ? (
                <p
                  id="content-error"
                  className="text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              ) : guidelinesError ? (
                <p className="text-destructive" role="alert">
                  Could not load your brands and products. Check your
                  Supabase permissions and refresh the page.
                </p>
              ) : (
                <p id="content-hint" className="text-muted-foreground">
                  Press{' '}
                  <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">
                    Ctrl
                  </kbd>{' '}
                  +{' '}
                  <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">
                    Enter
                  </kbd>{' '}
                  to analyze
                </p>
              )}

              <span className="tabular-nums text-muted-foreground">
                {content.length.toLocaleString()} /{' '}
                {MAX_CHARS.toLocaleString()}
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

            <Button
              type="submit"
              disabled={
                busy ||
                isLoading ||
                !!guidelinesError ||
                !brandId ||
                !productId
              }
              className="sm:min-w-40"
            >
              {scanning ? (
                <Loader2
                  data-icon="inline-start"
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <ScanSearch
                  data-icon="inline-start"
                  aria-hidden="true"
                />
              )}
              {scanning ? 'Analyzing…' : 'Analyze content'}
            </Button>
          </div>
        </form>
      </Card>

      <aside
        aria-label="Approved evidence in scope"
        className="flex flex-col gap-4"
      >
        <Card className="gap-3 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileText
              className="size-4 text-primary"
              aria-hidden="true"
            />
            Evidence in scope
          </div>

          {product ? (
            <dl className="grid gap-2.5 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Product</dt>
                <dd className="font-medium">{product.name}</dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Approved price
                </dt>
                <dd className="font-medium tabular-nums">
                  {formatINR(product.price)}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Battery
                </dt>
                <dd>
                  {product.batteryClaim ||
                    (product.batteryHours > 0
                      ? `${product.batteryHours} hours`
                      : 'No approved battery claim recorded')}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Brand rules
                </dt>
                <dd>
                  {guidelines?.rules.filter(
                    (rule) => rule.brandId === brandId,
                  ).length ?? 0}{' '}
                  active
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Offer records
                </dt>
                <dd>
                  {guidelines?.offers.filter(
                    (offer) =>
                      offer.brandId === brandId &&
                      (offer.productId === null ||
                        offer.productId === productId),
                  ).length ?? 0}{' '}
                  on file
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              {brandId
                ? 'Add a product to this brand to see its approved facts.'
                : 'Add a brand and product to see approved facts.'}
            </p>
          )}
        </Card>

        <Card className="gap-2 p-4 text-sm">
          <p className="font-medium">What gets checked</p>

          <ul className="flex flex-col gap-1.5 text-muted-foreground">
            {SCAN_STEPS.slice(1).map((step) => (
              <li key={step} className="flex gap-2">
                <span
                  className="mt-2 size-1 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                {step}
              </li>
            ))}
          </ul>
        </Card>
      </aside>
    </div>
  )
}
