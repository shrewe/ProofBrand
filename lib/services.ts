/**
 * ProofBrand frontend service layer.
 *
 * Supabase:
 * - Brands
 * - Products
 * - Brand rules
 *
 * Browser localStorage:
 * - Promotional offers
 * - Evidence sources
 * - Reviews
 */
import { analyzeContent } from './analysis'
import { createClient } from '@/lib/supabase/client'
import type {
  Brand,
  BrandRule,
  Guidelines,
  Offer,
  ProductFact,
  Review,
  ReviewInput,
} from './types'

const GUIDELINES_KEY = 'proofbrand:guidelines:v1'
const REVIEWS_KEY = 'proofbrand:reviews:v1'

const emptyGuidelines = (): Guidelines => ({
  brands: [],
  products: [],
  rules: [],
  offers: [],
  sources: [],
})

function read<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write<T>(key: string, value: T) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value))
    }
  } catch (error) {
    console.error('Could not save local data:', error)
  }
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

/**
 * Get the company associated with the currently signed-in user.
 */
async function getCompanyId(): Promise<string> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Please sign in before managing brand guidelines.')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (error || !profile?.company_id) {
    throw new Error(
      'Your company profile was not found. Please sign out and sign in again.',
    )
  }

  return profile.company_id as string
}

/**
 * Remove known demo records from previously saved browser data.
 * Rules are loaded from Supabase separately and are not taken from this cache.
 */
function removeDemoGuidelines(g: Guidelines): Guidelines {
  const demoProductIds = new Set([
    'novabuds',
    'novawatch-s2',
    'novacharge-20k',
  ])

  const demoRuleIds = new Set([
    'rule-brand-name',
    'rule-product-name',
  ])

  const demoOfferIds = new Set([
    'offer-festive-20',
    'offer-watch-10',
  ])

  const demoSourceIds = new Set([
    'src-product-facts',
    'src-brand-terminology',
    'src-offer-records',
  ])

  return {
    brands: g.brands.filter((brand) => brand.id !== 'novatech'),
    products: g.products.filter(
      (product) =>
        product.brandId !== 'novatech' &&
        !demoProductIds.has(product.id),
    ),
    rules: g.rules.filter(
      (rule) =>
        rule.brandId !== 'novatech' &&
        !demoRuleIds.has(rule.id),
    ),
    offers: g.offers.filter(
      (offer) =>
        offer.brandId !== 'novatech' &&
        !demoOfferIds.has(offer.id),
    ),
    sources: g.sources.filter(
      (source) => !demoSourceIds.has(source.id),
    ),
  }
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex((existing) => existing.id === item.id)

  if (index === -1) return [...list, item]

  const next = [...list]
  next[index] = item
  return next
}

function mapBrandRule(row: {
  id: string
  brand_id: string
  title: string
  approved: string
  disallowed: string[] | null
  description: string | null
  source_id: string | null
  updated_at: string | null
}): BrandRule {
  return {
    id: row.id,
    brandId: row.brand_id,
    title: row.title,
    approved: row.approved,
    disallowed: Array.isArray(row.disallowed) ? row.disallowed : [],
    description: row.description ?? '',
    sourceId: row.source_id ?? '',
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }
}

// ---------- Brands ----------

/**
 * Create a brand belonging to the signed-in user's company.
 */
export async function createBrand(name: string): Promise<Brand> {
  const cleanName = name.trim()

  if (!cleanName) {
    throw new Error('Enter a brand name.')
  }

  if (cleanName.length > 100) {
    throw new Error('Brand names must be 100 characters or fewer.')
  }

  const supabase = createClient()
  const companyId = await getCompanyId()

  const { data: existing, error: lookupError } = await supabase
    .from('brands')
    .select('id, name')
    .eq('company_id', companyId)
    .ilike('name', cleanName)

  if (lookupError) {
    throw new Error(`Could not check existing brands: ${lookupError.message}`)
  }

  if (existing?.length) {
    throw new Error('A brand with that name already exists.')
  }

  const { data, error } = await supabase
    .from('brands')
    .insert({
      company_id: companyId,
      name: cleanName,
    })
    .select('id, name')
    .single()

  if (error) {
    throw new Error(`Could not save brand: ${error.message}`)
  }

  const brand: Brand = {
    id: data.id,
    name: data.name,
  }

  const current = read<Guidelines>(GUIDELINES_KEY) ?? emptyGuidelines()
  const cleaned = removeDemoGuidelines(current)

  write(GUIDELINES_KEY, {
    ...cleaned,
    brands: upsert(
      cleaned.brands.filter((item) => item.id !== brand.id),
      brand,
    ),
  })

  return brand
}

// ---------- Guidelines ----------

/**
 * Load brands, products, and rules from Supabase.
 * Offers and evidence sources remain browser-local.
 *
 * Rules from localStorage are intentionally not merged into the result:
 * Supabase is now the source of truth for rules.
 */
export async function getGuidelines(): Promise<Guidelines> {
  const stored = read<Guidelines>(GUIDELINES_KEY)
  const local = removeDemoGuidelines(stored ?? emptyGuidelines())

  const supabase = createClient()
  const companyId = await getCompanyId()

  const [
    { data: dbBrands, error: brandsError },
    { data: dbProducts, error: productsError },
    { data: dbRules, error: rulesError },
  ] = await Promise.all([
    supabase
      .from('brands')
      .select('id, name')
      .eq('company_id', companyId)
      .order('name'),

    supabase
      .from('product_facts')
      .select(
        'id, brand_id, name, price, battery_hours, battery_claim, source_id, updated_at',
      )
      .eq('company_id', companyId)
      .order('name'),

    supabase
      .from('brand_rules')
      .select(
        'id, brand_id, title, approved, disallowed, description, source_id, updated_at',
      )
      .eq('company_id', companyId)
      .order('title'),
  ])

  if (brandsError) {
    throw new Error(`Could not load brands: ${brandsError.message}`)
  }

  if (productsError) {
    throw new Error(`Could not load products: ${productsError.message}`)
  }

  if (rulesError) {
    throw new Error(`Could not load brand rules: ${rulesError.message}`)
  }

  const brands: Brand[] = (dbBrands ?? []).map((brand) => ({
    id: brand.id,
    name: brand.name,
  }))

  const products: ProductFact[] = (dbProducts ?? []).map((product) => ({
    id: product.id,
    brandId: product.brand_id,
    name: product.name,
    price: Number(product.price ?? 0),
    batteryHours: Number(product.battery_hours ?? 0),
    batteryClaim: product.battery_claim ?? '',
    sourceId: product.source_id ?? '',
    updatedAt: product.updated_at ?? new Date().toISOString(),
  }))

  const rules: BrandRule[] = (dbRules ?? []).map((rule) =>
    mapBrandRule({
      id: rule.id,
      brand_id: rule.brand_id,
      title: rule.title,
      approved: rule.approved,
      disallowed: rule.disallowed,
      description: rule.description,
      source_id: rule.source_id,
      updated_at: rule.updated_at,
    }),
  )

  const brandIds = new Set(brands.map((brand) => brand.id))
  const productIds = new Set(products.map((product) => product.id))

  const guidelines: Guidelines = {
    brands: [
      ...brands,
      ...local.brands.filter((brand) => !brandIds.has(brand.id)),
    ],
    products: [
      ...products,
      ...local.products.filter((product) => !productIds.has(product.id)),
    ],
    rules,
    offers: local.offers,
    sources: local.sources,
  }

  write(GUIDELINES_KEY, guidelines)
  return guidelines
}

export async function getBrandRules(): Promise<BrandRule[]> {
  return (await getGuidelines()).rules
}

export async function getApprovedFacts(): Promise<ProductFact[]> {
  return (await getGuidelines()).products
}

export async function getOffers(): Promise<Offer[]> {
  return (await getGuidelines()).offers
}

// ---------- Products ----------

/**
 * Save a new product to Supabase.
 */
export async function saveProduct(
  product: Omit<ProductFact, 'id'> & { id?: string },
): Promise<ProductFact> {
  const name = product.name.trim()

  if (!name) {
    throw new Error('Enter a product name.')
  }

  if (!product.brandId) {
    throw new Error('Select a brand for this product.')
  }

  if (!Number.isFinite(product.price) || product.price < 0) {
    throw new Error('Enter a valid non-negative price.')
  }

  if (
    !Number.isFinite(product.batteryHours) ||
    product.batteryHours < 0
  ) {
    throw new Error('Enter valid battery hours.')
  }

  const supabase = createClient()
  const companyId = await getCompanyId()

  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id')
    .eq('id', product.brandId)
    .eq('company_id', companyId)
    .single()

  if (brandError || !brand) {
    throw new Error('Select a valid brand belonging to your company.')
  }

  const { data, error } = await supabase
    .from('product_facts')
    .insert({
      company_id: companyId,
      brand_id: product.brandId,
      name,
      price: product.price,
      battery_hours: product.batteryHours,
      battery_claim: product.batteryClaim.trim(),
      source_id: product.sourceId || null,
    })
    .select(
      'id, brand_id, name, price, battery_hours, battery_claim, source_id, updated_at',
    )
    .single()

  if (error) {
    throw new Error(`Could not save product: ${error.message}`)
  }

  const record: ProductFact = {
    id: data.id,
    brandId: data.brand_id,
    name: data.name,
    price: Number(data.price ?? 0),
    batteryHours: Number(data.battery_hours ?? 0),
    batteryClaim: data.battery_claim ?? '',
    sourceId: data.source_id ?? '',
    updatedAt: data.updated_at ?? new Date().toISOString(),
  }

  const current = read<Guidelines>(GUIDELINES_KEY) ?? emptyGuidelines()
  const cleaned = removeDemoGuidelines(current)

  write(GUIDELINES_KEY, {
    ...cleaned,
    products: upsert(
      cleaned.products.filter((item) => item.id !== record.id),
      record,
    ),
  })

  return record
}

// ---------- Brand rules in Supabase ----------

/**
 * Create or update a brand rule in Supabase.
 *
 * Existing browser-only rule IDs are not UUIDs. If one is passed in,
 * create a new database record rather than attempting to update an invalid ID.
 */
export async function saveRule(
  rule: Omit<BrandRule, 'id'> & { id?: string },
): Promise<BrandRule> {
  const title = rule.title.trim()
  const approved = rule.approved.trim()
  const disallowed = [...new Set(
    rule.disallowed.map((item) => item.trim()).filter(Boolean),
  )]

  if (!rule.brandId) {
    throw new Error('Select a brand for this rule.')
  }

  if (!title) {
    throw new Error('Enter a rule title.')
  }

  if (!approved) {
    throw new Error('Enter the approved term.')
  }

  if (disallowed.length === 0) {
    throw new Error('Enter at least one disallowed variant.')
  }

  if (
    disallowed.some(
      (item) => item.toLocaleLowerCase() === approved.toLocaleLowerCase(),
    )
  ) {
    throw new Error('The approved term cannot also be disallowed.')
  }

  const supabase = createClient()
  const companyId = await getCompanyId()

  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id')
    .eq('id', rule.brandId)
    .eq('company_id', companyId)
    .single()

  if (brandError || !brand) {
    throw new Error('Select a valid brand belonging to your company.')
  }

  const payload = {
    company_id: companyId,
    brand_id: rule.brandId,
    title,
    approved,
    disallowed,
    description: rule.description.trim(),
    // Evidence sources are still browser-local, so don't store a demo ID.
    source_id: null,
    updated_at: new Date().toISOString(),
  }

  const shouldUpdate = Boolean(rule.id && isUuid(rule.id))

  if (shouldUpdate) {
    const { data, error } = await supabase
      .from('brand_rules')
      .update(payload)
      .eq('id', rule.id!)
      .eq('company_id', companyId)
      .select(
        'id, brand_id, title, approved, disallowed, description, source_id, updated_at',
      )
      .single()

    if (error) {
      throw new Error(`Could not update brand rule: ${error.message}`)
    }

    if (!data) {
      throw new Error('The brand rule was not found or you cannot edit it.')
    }

    return mapBrandRule(data)
  }

  const { data, error } = await supabase
    .from('brand_rules')
    .insert(payload)
    .select(
      'id, brand_id, title, approved, disallowed, description, source_id, updated_at',
    )
    .single()

  if (error) {
    throw new Error(`Could not save brand rule: ${error.message}`)
  }

  return mapBrandRule(data)
}

// ---------- Promotional offers remain browser-local ----------

export async function saveOffer(
  offer: Omit<Offer, 'id'> & { id?: string },
): Promise<Offer> {
  const guidelines = await getGuidelines()

  const record: Offer = {
    ...offer,
    id: offer.id ?? newId('offer'),
  }

  write(GUIDELINES_KEY, {
    ...guidelines,
    offers: upsert(guidelines.offers, record),
  })

  return record
}

export async function deleteGuidelineRecord(
  kind: 'products' | 'rules' | 'offers',
  id: string,
): Promise<void> {
  const supabase = createClient()
  const companyId = await getCompanyId()

  if (kind === 'products') {
    const { error } = await supabase
      .from('product_facts')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      throw new Error(`Could not delete product: ${error.message}`)
    }

    const current = read<Guidelines>(GUIDELINES_KEY) ?? emptyGuidelines()

    write(GUIDELINES_KEY, {
      ...current,
      products: current.products.filter((item) => item.id !== id),
    })

    return
  }

  if (kind === 'rules') {
    if (!isUuid(id)) {
      throw new Error(
        'This rule is an old browser-only record. Refresh the page and select a rule saved in the database.',
      )
    }

    const { error } = await supabase
      .from('brand_rules')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      throw new Error(`Could not delete brand rule: ${error.message}`)
    }

    return
  }

  const guidelines = await getGuidelines()

  write(GUIDELINES_KEY, {
    ...guidelines,
    offers: guidelines.offers.filter((item) => item.id !== id),
  })
}

/**
 * Retained for compatibility with any existing callers.
 * This clears browser-local guidelines only; it does not delete Supabase data.
 */
export async function resetGuidelines(): Promise<void> {
  write(GUIDELINES_KEY, emptyGuidelines())
}

// ---------- Reviews remain browser-local ----------

function buildReview(
  input: ReviewInput,
  guidelines: Guidelines,
  createdAt: Date,
): Review {
  const product = guidelines.products.find(
    (item) => item.id === input.productId,
  )

  const brand = guidelines.brands.find(
    (item) => item.id === input.brandId,
  )

  const { findings, verified } = analyzeContent(
    input,
    guidelines,
    createdAt,
  )

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

export async function getReviews(): Promise<Review[]> {
  let reviews = read<Review[]>(REVIEWS_KEY)

  if (!reviews) {
    reviews = []
    write(REVIEWS_KEY, reviews)
  }

  const cleaned = reviews.filter(
    (review) =>
      !['rv-seed-1', 'rv-seed-2', 'rv-seed-3'].includes(review.id),
  )

  if (cleaned.length !== reviews.length) {
    write(REVIEWS_KEY, cleaned)
  }

  return [...cleaned].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
}

export async function getReviewById(
  id: string,
): Promise<Review | null> {
  return (await getReviews()).find((review) => review.id === id) ?? null
}

export async function createReview(
  input: ReviewInput,
): Promise<Review> {
  if (!input.content.trim()) {
    throw new Error('Content is required.')
  }

  const guidelines = await getGuidelines()

  const brandExists = guidelines.brands.some(
    (brand) => brand.id === input.brandId,
  )

  const productExists = guidelines.products.some(
    (product) =>
      product.id === input.productId &&
      product.brandId === input.brandId,
  )

  if (!brandExists) {
    throw new Error('Select a valid brand before analyzing content.')
  }

  if (!productExists) {
    throw new Error('Select a valid product for the chosen brand.')
  }

  const review = buildReview(input, guidelines, new Date())
  const reviews = await getReviews()

  write(REVIEWS_KEY, [review, ...reviews])
  return review
}

export async function updateReview(
  review: Review,
): Promise<Review> {
  const reviews = await getReviews()

  if (!reviews.some((item) => item.id === review.id)) {
    throw new Error('Review not found.')
  }

  const next: Review = {
    ...review,
    updatedAt: new Date().toISOString(),
  }

  write(
    REVIEWS_KEY,
    reviews.map((item) => (item.id === review.id ? next : item)),
  )

  return next
}

export async function deleteReview(id: string): Promise<void> {
  const reviews = await getReviews()

  write(
    REVIEWS_KEY,
    reviews.filter((item) => item.id !== id),
  )
}
