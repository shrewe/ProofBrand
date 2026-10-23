'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { revalidateGuidelines } from '@/lib/hooks'
import { saveOffer, saveProduct, saveRule } from '@/lib/services'
import { toISODate } from '@/lib/format'
import type { BrandRule, Guidelines, Offer, ProductFact } from '@/lib/types'

export type EditTarget =
  | { kind: 'products'; record: ProductFact | null }
  | { kind: 'rules'; record: BrandRule | null }
  | { kind: 'offers'; record: Offer | null }

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

const titles = {
  products: 'product fact',
  rules: 'brand rule',
  offers: 'promotional offer',
}

export function GuidelineDialog({
  target,
  guidelines,
  onClose,
}: {
  target: EditTarget | null
  guidelines: Guidelines
  onClose: () => void
}) {
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {target && (
          <>
            <DialogHeader>
              <DialogTitle>
                {target.record ? 'Edit' : 'Add'} {titles[target.kind]}
              </DialogTitle>
              <DialogDescription>
                Changes are saved in this browser and used by the next content analysis.
              </DialogDescription>
            </DialogHeader>
            {target.kind === 'products' && (
              <ProductForm record={target.record} guidelines={guidelines} onDone={onClose} />
            )}
            {target.kind === 'rules' && <RuleForm record={target.record} guidelines={guidelines} onDone={onClose} />}
            {target.kind === 'offers' && <OfferForm record={target.record} guidelines={guidelines} onDone={onClose} />}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function FormFooter({ onCancel, saving }: { onCancel: () => void; saving: boolean }) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </DialogFooter>
  )
}

async function persist(fn: () => Promise<unknown>, label: string, onDone: () => void, setSaving: (v: boolean) => void) {
  setSaving(true)
  try {
    await fn()
    await revalidateGuidelines()
    toast.success(`${label} saved`)
    onDone()
  } catch {
    toast.error(`Could not save ${label.toLowerCase()}`)
  } finally {
    setSaving(false)
  }
}

function ProductForm({ record, guidelines, onDone }: { record: ProductFact | null; guidelines: Guidelines; onDone: () => void }) {
  const [name, setName] = useState(record?.name ?? '')
  const [price, setPrice] = useState(record ? String(record.price) : '')
  const [hours, setHours] = useState(record ? String(record.batteryHours) : '')
  const [claim, setClaim] = useState(record?.batteryClaim ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Product name is required.'
    if (!/^\d+$/.test(price) || Number(price) <= 0) next.price = 'Enter a whole rupee amount greater than 0.'
    if (!/^\d+$/.test(hours)) next.hours = 'Enter battery hours as a whole number (0 if not applicable).'
    if (!claim.trim()) next.claim = 'Approved claim wording is required.'
    setErrors(next)
    if (Object.keys(next).length) return
    persist(
      () =>
        saveProduct({
          id: record?.id,
          brandId: record?.brandId ?? guidelines.brands[0]?.id ?? 'novatech',
          name: name.trim(),
          price: Number(price),
          batteryHours: Number(hours),
          batteryClaim: claim.trim(),
          sourceId: record?.sourceId ?? 'src-product-facts',
          updatedAt: toISODate(new Date()),
        }),
      'Product fact',
      onDone,
      setSaving,
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field id="p-name" label="Product name" error={errors.name}>
        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="p-price" label="Approved price (₹)" error={errors.price}>
          <Input id="p-price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} aria-invalid={!!errors.price} />
        </Field>
        <Field id="p-hours" label="Battery hours" error={errors.hours}>
          <Input id="p-hours" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} aria-invalid={!!errors.hours} />
        </Field>
      </div>
      <Field id="p-claim" label="Approved battery claim" error={errors.claim}>
        <Input id="p-claim" value={claim} onChange={(e) => setClaim(e.target.value)} aria-invalid={!!errors.claim} />
      </Field>
      <FormFooter onCancel={onDone} saving={saving} />
    </form>
  )
}

function RuleForm({ record, guidelines, onDone }: { record: BrandRule | null; guidelines: Guidelines; onDone: () => void }) {
  const [title, setTitle] = useState(record?.title ?? '')
  const [approved, setApproved] = useState(record?.approved ?? '')
  const [disallowed, setDisallowed] = useState(record?.disallowed.join(', ') ?? '')
  const [description, setDescription] = useState(record?.description ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const variants = disallowed
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Rule title is required.'
    if (!approved.trim()) next.approved = 'Approved term is required.'
    if (variants.length === 0) next.disallowed = 'List at least one disallowed variant.'
    else if (variants.includes(approved.trim())) next.disallowed = 'The approved term cannot also be disallowed.'
    setErrors(next)
    if (Object.keys(next).length) return
    persist(
      () =>
        saveRule({
          id: record?.id,
          brandId: record?.brandId ?? guidelines.brands[0]?.id ?? 'novatech',
          title: title.trim(),
          approved: approved.trim(),
          disallowed: variants,
          description: description.trim(),
          sourceId: record?.sourceId ?? 'src-brand-terminology',
          updatedAt: toISODate(new Date()),
        }),
      'Brand rule',
      onDone,
      setSaving,
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field id="r-title" label="Rule title" error={errors.title}>
        <Input id="r-title" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} />
      </Field>
      <Field id="r-approved" label="Approved term" error={errors.approved}>
        <Input id="r-approved" value={approved} onChange={(e) => setApproved(e.target.value)} aria-invalid={!!errors.approved} />
      </Field>
      <Field id="r-disallowed" label="Disallowed variants" error={errors.disallowed} hint="Comma-separated. Matched case-sensitively.">
        <Input id="r-disallowed" value={disallowed} onChange={(e) => setDisallowed(e.target.value)} aria-invalid={!!errors.disallowed} />
      </Field>
      <Field id="r-desc" label="Description">
        <Textarea id="r-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <FormFooter onCancel={onDone} saving={saving} />
    </form>
  )
}

function OfferForm({ record, guidelines, onDone }: { record: Offer | null; guidelines: Guidelines; onDone: () => void }) {
  const [name, setName] = useState(record?.name ?? '')
  const [discount, setDiscount] = useState(record ? String(record.discountPercent) : '')
  const [from, setFrom] = useState(record?.validFrom ?? toISODate(new Date()))
  const [until, setUntil] = useState(record?.validUntil ?? '')
  const [productId, setProductId] = useState(record?.productId ?? guidelines.products[0]?.id ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const pct = Number(discount)
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Offer name is required.'
    if (!/^\d+$/.test(discount) || pct < 1 || pct > 90) next.discount = 'Enter a whole percentage between 1 and 90.'
    if (!from) next.from = 'Start date is required.'
    if (!until) next.until = 'End date is required.'
    else if (from && until < from) next.until = 'End date must be on or after the start date.'
    setErrors(next)
    if (Object.keys(next).length) return
    persist(
      () =>
        saveOffer({
          id: record?.id,
          brandId: record?.brandId ?? guidelines.brands[0]?.id ?? 'novatech',
          productId: productId || null,
          name: name.trim(),
          discountPercent: pct,
          validFrom: from,
          validUntil: until,
          sourceId: record?.sourceId ?? 'src-offer-records',
        }),
      'Offer',
      onDone,
      setSaving,
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field id="o-name" label="Offer name" error={errors.name}>
        <Input id="o-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="o-discount" label="Discount (%)" error={errors.discount}>
          <Input id="o-discount" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value)} aria-invalid={!!errors.discount} />
        </Field>
        <Field id="o-product" label="Applies to">
          <select
            id="o-product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">All products</option>
            {guidelines.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="o-from" label="Valid from" error={errors.from}>
          <Input id="o-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-invalid={!!errors.from} />
        </Field>
        <Field id="o-until" label="Valid until (inclusive)" error={errors.until}>
          <Input id="o-until" type="date" value={until} onChange={(e) => setUntil(e.target.value)} aria-invalid={!!errors.until} />
        </Field>
      </div>
      <FormFooter onCancel={onDone} saving={saving} />
    </form>
  )
}
