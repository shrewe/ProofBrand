export type Severity = 'high' | 'medium' | 'low'

export type FindingStatus = 'open' | 'fixed' | 'needs-verification'

export type FindingCategory =
  | 'brand-consistency'
  | 'product-fact'
  | 'price'
  | 'expired-offer'
  | 'unapproved-offer'
  | 'unsupported-claim'

/** How the claim relates to the approved evidence. */
export type EvidenceVerdict = 'contradicted' | 'expired' | 'inconsistent' | 'unsupported'

export type ReviewStatus = 'approved' | 'ready' | 'changes-required' | 'in-review'

export type RiskLevel = 'high' | 'medium' | 'low' | 'none'

export interface Brand {
  id: string
  name: string
}

export interface EvidenceSource {
  id: string
  label: string
  type: 'Product facts' | 'Brand rule' | 'Offer record' | 'Claim substantiation'
  owner: string
  description: string
  updatedAt: string
}

export interface ProductFact {
  id: string
  brandId: string
  name: string
  price: number
  batteryHours: number
  batteryClaim: string
  sourceId: string
  updatedAt: string
}

export interface BrandRule {
  id: string
  brandId: string
  title: string
  /** Approved term, e.g. "NovaTech". */
  approved: string
  /** Disallowed variants, e.g. ["Nova Tech", "Novatech"]. Matched case-sensitively. */
  disallowed: string[]
  description: string
  sourceId: string
  updatedAt: string
}

export interface Offer {
  id: string
  brandId: string
  productId: string | null
  name: string
  discountPercent: number
  validFrom: string
  /** ISO date (yyyy-mm-dd), inclusive. */
  validUntil: string
  sourceId: string
}

export interface Guidelines {
  brands: Brand[]
  products: ProductFact[]
  rules: BrandRule[]
  offers: Offer[]
  sources: EvidenceSource[]
}

export interface TextEdit {
  start: number
  end: number
  replacement: string
}

export interface Evidence {
  sourceId: string | null
  sourceLabel: string
  recordTitle: string
  approvedValue: string
}

export interface Finding {
  id: string
  category: FindingCategory
  verdict: EvidenceVerdict
  severity: Severity
  excerpt: string
  span: { start: number; end: number }
  explanation: string
  /** null means no approved source exists — the claim needs verification, not "false". */
  evidence: Evidence | null
  suggestion: string
  edits: TextEdit[]
  status: FindingStatus
}

export interface VerifiedClaim {
  id: string
  excerpt: string
  note: string
  evidence: Evidence
}

export interface Review {
  id: string
  title: string
  brandId: string
  brandName: string
  productId: string
  productName: string
  content: string
  createdAt: string
  updatedAt: string
  analyzedOn: string
  findings: Finding[]
  verified: VerifiedClaim[]
  approved: boolean
}

export interface ReviewInput {
  title: string
  brandId: string
  productId: string
  content: string
}
