/**
 * Deterministic, rule-based mock analysis for the prototype.
 * No AI or network call happens here — every finding is derived from the
 * seeded guideline records. Replace `analyzeContent` with a call to
 * POST /api/reviews once the FastAPI backend exists.
 */
import { formatINR, toISODate } from './format'
import type {
  Evidence,
  Finding,
  Guidelines,
  Offer,
  ReviewInput,
  TextEdit,
  VerifiedClaim,
} from './types'

interface Sentence {
  text: string
  /** Start index including any leading whitespace — used for clean removals. */
  rawStart: number
  start: number
  end: number
}

function splitSentences(text: string): Sentence[] {
  const out: Sentence[] = []
  const re = /[^.!?]+[.!?]+|[^.!?]+$/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const raw = m[0]
    const lead = raw.length - raw.trimStart().length
    const trimmed = raw.trim()
    if (!trimmed) continue
    out.push({
      text: trimmed,
      rawStart: m.index,
      start: m.index + lead,
      end: m.index + lead + trimmed.length,
    })
  }
  return out
}

function removeSentenceEdit(sentence: Sentence): TextEdit {
  return { start: sentence.rawStart, end: sentence.end, replacement: '' }
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseAmount(raw: string) {
  return Number(raw.replace(/,/g, ''))
}

function sentenceAt(sentences: Sentence[], index: number) {
  return sentences.find((s) => index >= s.start && index < s.end)
}

function makeId(prefix: string, index: number) {
  return `${prefix}-${index}`
}

export interface AnalysisResult {
  findings: Finding[]
  verified: VerifiedClaim[]
}

export function analyzeContent(
  input: Pick<ReviewInput, 'content' | 'brandId' | 'productId'>,
  guidelines: Guidelines,
  today: Date = new Date(),
): AnalysisResult {
  const text = input.content
  const todayISO = toISODate(today)
  const sentences = splitSentences(text)
  const findings: Finding[] = []
  const verified: VerifiedClaim[] = []
  const sourceLabel = (id: string) =>
    guidelines.sources.find((s) => s.id === id)?.label ?? 'Approved record'

  const product = guidelines.products.find((p) => p.id === input.productId)
  const rules = guidelines.rules.filter((r) => r.brandId === input.brandId)
  const offers = guidelines.offers.filter(
    (o) => o.brandId === input.brandId && (o.productId === null || o.productId === input.productId),
  )

  // 1. Brand terminology
  for (const rule of rules) {
    for (const variant of rule.disallowed) {
      if (variant === rule.approved) continue
      const re = new RegExp(`(?<![A-Za-z])${escapeRegExp(variant)}(?![A-Za-z])`, 'g')
      const matches = [...text.matchAll(re)]
      if (matches.length === 0) continue
      findings.push({
        id: makeId('brand', findings.length),
        category: 'brand-consistency',
        verdict: 'inconsistent',
        severity: 'medium',
        excerpt: variant,
        span: { start: matches[0].index!, end: matches[0].index! + variant.length },
        explanation: `The copy writes “${variant}”${matches.length > 1 ? ` ${matches.length} times` : ''}, which differs from the approved spelling.`,
        evidence: {
          sourceId: rule.sourceId,
          sourceLabel: sourceLabel(rule.sourceId),
          recordTitle: rule.title,
          approvedValue: `Approved spelling is “${rule.approved}”.`,
        },
        suggestion: `Replace “${variant}” with “${rule.approved}”.`,
        edits: matches.map((m) => ({
          start: m.index!,
          end: m.index! + variant.length,
          replacement: rule.approved,
        })),
        status: 'open',
      })
    }
    const approvedRe = new RegExp(`(?<![A-Za-z])${escapeRegExp(rule.approved)}(?![A-Za-z])`)
    const approvedMatch = text.match(approvedRe)
    if (approvedMatch && !verified.some((v) => v.excerpt === rule.approved)) {
      verified.push({
        id: makeId('ok-term', verified.length),
        excerpt: rule.approved,
        note: 'Matches the approved spelling.',
        evidence: {
          sourceId: rule.sourceId,
          sourceLabel: sourceLabel(rule.sourceId),
          recordTitle: rule.title,
          approvedValue: rule.approved,
        },
      })
    }
  }

  if (product) {
    const factEvidence = (approvedValue: string, title: string): Evidence => ({
      sourceId: product.sourceId,
      sourceLabel: sourceLabel(product.sourceId),
      recordTitle: `${product.name} — ${title}`,
      approvedValue,
    })

    // 2. Battery claims
    const batteryRe =
      /(?:(?:an?|with)\s+)?(?:(?:incredible|amazing|massive|whopping|unbelievable|huge)\s+)?(?<claim>(?:up\s+to\s+)?(?<hours>\d+)[\s-]?(?:hours?|hrs?|h)\b(?:\s+of)?\s+(?:battery(?:\s+life)?|on\s+a\s+single\s+charge|of\s+playback|playtime))/dgi
    for (const m of text.matchAll(batteryRe)) {
      const [cStart, cEnd] = m.indices!.groups!.claim
      const claimText = m.groups!.claim
      const hours = Number(m.groups!.hours)
      if (product.batteryHours <= 0) {
        findings.push({
          id: makeId('battery', findings.length),
          category: 'product-fact',
          verdict: 'unsupported',
          severity: 'medium',
          excerpt: claimText,
          span: { start: cStart, end: cEnd },
          explanation: `${product.name} has no approved battery specification, so this claim cannot be verified.`,
          evidence: factEvidence(product.batteryClaim, 'Battery'),
          suggestion: 'Remove the battery claim or request an approved specification.',
          edits: [],
          status: 'needs-verification',
        })
      } else if (hours > product.batteryHours) {
        findings.push({
          id: makeId('battery', findings.length),
          category: 'product-fact',
          verdict: 'contradicted',
          severity: 'high',
          excerpt: claimText,
          span: { start: cStart, end: cEnd },
          explanation: `The copy claims ${hours} hours, which exceeds the approved battery specification of ${product.batteryHours} hours.`,
          evidence: factEvidence(product.batteryClaim, 'Battery'),
          suggestion: `“Up to ${product.batteryHours} hours of battery life${product.batteryClaim.toLowerCase().includes('charging case') ? ' with the charging case' : ''}.”`,
          edits: [
            {
              start: m.index!,
              end: m.index! + m[0].length,
              replacement: `up to ${product.batteryHours} hours of battery life${product.batteryClaim.toLowerCase().includes('charging case') ? ' with the charging case' : ''}`,
            },
          ],
          status: 'open',
        })
      } else {
        verified.push({
          id: makeId('ok-battery', verified.length),
          excerpt: claimText,
          note: `Within the approved ${product.batteryHours}-hour specification.`,
          evidence: factEvidence(product.batteryClaim, 'Battery'),
        })
      }
    }

    // 3. Prices
    const now = todayISO
    const isActive = (o: Offer) => o.validFrom <= now && now <= o.validUntil
    const discounted = (o: Offer) => Math.round(product.price * (1 - o.discountPercent / 100))
    const priceRe =
      /(?:(?:just|only)\s+)?(?<claim>(?:₹|Rs\.?\s?|INR\s?)\s?(?<amt>\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d{1,2})?)/dgi
    for (const m of text.matchAll(priceRe)) {
      const [cStart, cEnd] = m.indices!.groups!.claim
      const claimText = m.groups!.claim
      const amount = parseAmount(m.groups!.amt)
      if (amount === product.price) {
        verified.push({
          id: makeId('ok-price', verified.length),
          excerpt: claimText,
          note: 'Matches the approved price.',
          evidence: factEvidence(formatINR(product.price), 'Price'),
        })
        continue
      }
      const activeMatch = offers.find((o) => isActive(o) && Math.abs(discounted(o) - amount) <= 1)
      if (activeMatch) {
        verified.push({
          id: makeId('ok-price', verified.length),
          excerpt: claimText,
          note: `Matches the discounted price under the active “${activeMatch.name}”.`,
          evidence: factEvidence(
            `${formatINR(product.price)} less ${activeMatch.discountPercent}% (valid until ${activeMatch.validUntil})`,
            'Price',
          ),
        })
        continue
      }
      const expiredMatch = offers.find((o) => !isActive(o) && Math.abs(discounted(o) - amount) <= 1)
      findings.push({
        id: makeId('price', findings.length),
        category: 'price',
        verdict: 'contradicted',
        severity: 'high',
        excerpt: claimText,
        span: { start: cStart, end: cEnd },
        explanation: `The copy lists ${claimText}, which differs from the approved ${product.name} price.${expiredMatch ? ` It equals the discounted price from the “${expiredMatch.name}”, which is no longer active.` : ''}`,
        evidence: factEvidence(formatINR(product.price), 'Price'),
        suggestion: `“${formatINR(product.price)}”`,
        edits: [{ start: m.index!, end: m.index! + m[0].length, replacement: formatINR(product.price) }],
        status: 'open',
      })
    }

    // Product name present and correctly spelled
    if (text.includes(product.name) && !verified.some((v) => v.excerpt === product.name)) {
      verified.push({
        id: makeId('ok-product', verified.length),
        excerpt: product.name,
        note: 'Product name matches the approved catalog.',
        evidence: factEvidence(product.name, 'Name'),
      })
    }
  }

  // 4. Offers
  const offerRe = /(?<pct>\d{1,2})\s?%\s*(?:off|discount)/gi
  const handledSentences = new Set<number>()
  for (const m of text.matchAll(offerRe)) {
    const sentence = sentenceAt(sentences, m.index!)
    if (!sentence || handledSentences.has(sentence.start)) continue
    handledSentences.add(sentence.start)
    const pct = Number(m.groups!.pct)
    const record = offers.find((o) => o.discountPercent === pct)
    if (!record) {
      findings.push({
        id: makeId('offer', findings.length),
        category: 'unapproved-offer',
        verdict: 'unsupported',
        severity: 'high',
        excerpt: sentence.text,
        span: { start: sentence.start, end: sentence.end },
        explanation: `No approved offer record matches a ${pct}% discount for this product.`,
        evidence: null,
        suggestion: 'Remove the offer, or add the approved offer record before publishing.',
        edits: [removeSentenceEdit(sentence)],
        status: 'needs-verification',
      })
      continue
    }
    const evidence: Evidence = {
      sourceId: record.sourceId,
      sourceLabel: sourceLabel(record.sourceId),
      recordTitle: record.name,
      approvedValue: `${record.discountPercent}% off, valid ${record.validFrom} to ${record.validUntil}.`,
    }
    if (todayISO > record.validUntil || todayISO < record.validFrom) {
      const notStarted = todayISO < record.validFrom
      findings.push({
        id: makeId('offer', findings.length),
        category: 'expired-offer',
        verdict: 'expired',
        severity: 'high',
        excerpt: sentence.text,
        span: { start: sentence.start, end: sentence.end },
        explanation: notStarted
          ? `The “${record.name}” does not start until ${record.validFrom}; it is not active on ${todayISO}.`
          : `The “${record.name}” ended on ${record.validUntil} and is expired as of ${todayISO}.`,
        evidence,
        suggestion: 'Remove the offer unless a current approved offer exists.',
        edits: [removeSentenceEdit(sentence)],
        status: 'open',
      })
    } else {
      verified.push({
        id: makeId('ok-offer', verified.length),
        excerpt: sentence.text,
        note: `Active offer, valid until ${record.validUntil}.`,
        evidence,
      })
    }
  }

  // 5. Unsupported superlatives / guarantees
  const claimRe =
    /(?<claim>\bguaranteed\b[^.!?]*|(?:\bthe\s+)?(?:\bbest\b|#1\b|\bnumber[\s-]one\b|\bunbeatable\b|\bcheapest\b|\bfastest\b|\bworld'?s\s+first\b|\bmost\s+advanced\b)[^.!?]*)/dgi
  const claimSentences = new Set<number>()
  for (const m of text.matchAll(claimRe)) {
    const [cStart, cEnd] = m.indices!.groups!.claim
    const sentence = sentenceAt(sentences, cStart)
    if (!sentence || claimSentences.has(sentence.start)) continue
    claimSentences.add(sentence.start)
    findings.push({
      id: makeId('claim', findings.length),
      category: 'unsupported-claim',
      verdict: 'unsupported',
      severity: 'medium',
      excerpt: m.groups!.claim.trim(),
      span: { start: cStart, end: cStart + m.groups!.claim.trimEnd().length || cEnd },
      explanation:
        'This comparative or guaranteed claim has no supporting evidence in the approved dataset. It is not necessarily false, but it cannot be published without substantiation.',
      evidence: null,
      suggestion: 'Remove the guarantee or request approved substantiation (e.g. independent test data).',
      edits: [removeSentenceEdit(sentence)],
      status: 'needs-verification',
    })
  }

  findings.sort((a, b) => a.span.start - b.span.start)
  findings.forEach((f, i) => (f.id = `f${i + 1}`))
  return { findings, verified }
}
