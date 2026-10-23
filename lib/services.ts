/**
 * Frontend service layer. Each function mirrors a future FastAPI endpoint:
 *   GET  /api/rules         -> getGuidelines / getBrandRules / getApprovedFacts / getOffers
 *   POST /api/rules         -> saveRule / saveProduct / saveOffer
 *   POST /api/reviews       -> createReview
 *   GET  /api/reviews       -> getReviews
 *   GET  /api/reviews/{id}  -> getReviewById
 * For the prototype they read and write browser localStorage.
 */
import { analyzeContent } from './analysis'
import { seedGuidelines, seedReviewInputs } from './seed'
import type { BrandRule, Guidelines, Offer, ProductFact, Review, ReviewInput } from './types'

const GUIDELINES_KEY = 'proofbrand:guidelines:v1'
const REVIEWS_KEY = 'proofbrand:reviews:v1'

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

// ---------- Guidelines ----------

export async function getGuidelines(): Promise<Guidelines> {
  const stored = read<Guidelines>(GUIDELINES_KEY)
  if (stored) return stored
  write(GUIDELINES_KEY, seedGuidelines)
  return structuredClone(seedGuidelines)
}

export async function getBrandRules() {
  return (await getGuidelines()).rules
}

export async function getApprovedFacts() {
  return (await getGuidelines()).products
}

export async function getOffers() {
  return (await getGuidelines()).offers
}

function upsert<T extends { id: string }>(list: T[], item: T) {
  const i = list.findIndex((x) => x.id === item.id)
  if (i === -1) return [...list, item]
  const next = [...list]
  next[i] = item
  return next
}

export async function saveProduct(product: Omit<ProductFact, 'id'> & { id?: string }) {
  const g = await getGuidelines()
  const record = { ...product, id: product.id ?? newId('prod') } as ProductFact
  const next = { ...g, products: upsert(g.products, record) }
  write(GUIDELINES_KEY, next)
  return record
}

export async function saveRule(rule: Omit<BrandRule, 'id'> & { id?: string }) {
  const g = await getGuidelines()
  const record = { ...rule, id: rule.id ?? newId('rule') } as BrandRule
  write(GUIDELINES_KEY, { ...g, rules: upsert(g.rules, record) })
  return record
}

export async function saveOffer(offer: Omit<Offer, 'id'> & { id?: string }) {
  const g = await getGuidelines()
  const record = { ...offer, id: offer.id ?? newId('offer') } as Offer
  write(GUIDELINES_KEY, { ...g, offers: upsert(g.offers, record) })
  return record
}

export async function deleteGuidelineRecord(kind: 'products' | 'rules' | 'offers', id: string) {
  const g = await getGuidelines()
  const next = { ...g, [kind]: (g[kind] as { id: string }[]).filter((x) => x.id !== id) }
  write(GUIDELINES_KEY, next)
}

export async function resetGuidelines() {
  write(GUIDELINES_KEY, seedGuidelines)
}

// ---------- Reviews ----------

function buildReview(
  input: ReviewInput,
  guidelines: Guidelines,
  createdAt: Date,
): Review {
  const product = guidelines.products.find((p) => p.id === input.productId)
  const brand = guidelines.brands.find((b) => b.id === input.brandId)
  const { findings, verified } = analyzeContent(input, guidelines, createdAt)
  return {
    id: newId('rv'),
    title: input.title.trim() || `${product?.name ?? 'Content'} review`,
    brandId: input.brandId,
    brandName: brand?.name ?? input.brandId,
    productId: input.productId,
    productName: product?.name ?? input.productId,
    content: input.content,
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
    analyzedOn: createdAt.toISOString(),
    findings,
    verified,
    approved: false,
  }
}

async function seedReviews(): Promise<Review[]> {
  const guidelines = await getGuidelines()
  return seedReviewInputs.map((seed, i) => {
    const review = buildReview(seed, guidelines, new Date(seed.createdAt))
    review.id = `rv-seed-${i + 1}`
    if (seed.fixAll) review.findings = review.findings.map((f) => ({ ...f, status: 'fixed' as const }))
    if (seed.approved && review.findings.every((f) => f.status === 'fixed')) review.approved = true
    return review
  })
}

export async function getReviews(): Promise<Review[]> {
  let reviews = read<Review[]>(REVIEWS_KEY)
  if (!reviews) {
    reviews = await seedReviews()
    write(REVIEWS_KEY, reviews)
  }
  return [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getReviewById(id: string): Promise<Review | null> {
  return (await getReviews()).find((r) => r.id === id) ?? null
}

export async function createReview(input: ReviewInput): Promise<Review> {
  if (!input.content.trim()) throw new Error('Content is required.')
  const guidelines = await getGuidelines()
  const review = buildReview(input, guidelines, new Date())
  const reviews = await getReviews()
  write(REVIEWS_KEY, [review, ...reviews])
  return review
}

export async function updateReview(review: Review): Promise<Review> {
  const reviews = await getReviews()
  if (!reviews.some((r) => r.id === review.id)) throw new Error('Review not found.')
  const next = { ...review, updatedAt: new Date().toISOString() }
  write(
    REVIEWS_KEY,
    reviews.map((r) => (r.id === review.id ? next : r)),
  )
  return next
}

export async function deleteReview(id: string) {
  const reviews = await getReviews()
  write(
    REVIEWS_KEY,
    reviews.filter((r) => r.id !== id),
  )
}
