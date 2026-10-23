import type { Guidelines, ReviewInput } from './types'

export const SAMPLE_CONTENT =
  'Introducing Nova Tech NovaBuds! Enjoy an incredible 48-hour battery life for just ₹1,999. Get 20% off today with our special offer. These are guaranteed to be the best earbuds in India!'

export const seedGuidelines: Guidelines = {
  brands: [{ id: 'novatech', name: 'NovaTech' }],
  products: [
    {
      id: 'novabuds',
      brandId: 'novatech',
      name: 'NovaBuds',
      price: 2499,
      batteryHours: 24,
      batteryClaim: 'Up to 24 hours with the charging case',
      sourceId: 'src-product-facts',
      updatedAt: '2026-09-14',
    },
    {
      id: 'novawatch-s2',
      brandId: 'novatech',
      name: 'NovaWatch S2',
      price: 6999,
      batteryHours: 120,
      batteryClaim: 'Up to 5 days (120 hours) on a single charge',
      sourceId: 'src-product-facts',
      updatedAt: '2026-08-30',
    },
    {
      id: 'novacharge-20k',
      brandId: 'novatech',
      name: 'NovaCharge 20K',
      price: 1799,
      batteryHours: 0,
      batteryClaim: 'Not applicable (power bank, 20,000 mAh capacity)',
      sourceId: 'src-product-facts',
      updatedAt: '2026-07-02',
    },
  ],
  rules: [
    {
      id: 'rule-brand-name',
      brandId: 'novatech',
      title: 'Brand name spelling',
      approved: 'NovaTech',
      disallowed: ['Nova Tech', 'Novatech', 'NOVATECH', 'Nova-Tech'],
      description: 'Always write the company name as one word with a capital N and T.',
      sourceId: 'src-brand-terminology',
      updatedAt: '2026-06-01',
    },
    {
      id: 'rule-product-name',
      brandId: 'novatech',
      title: 'Product name spelling',
      approved: 'NovaBuds',
      disallowed: ['Nova Buds', 'Novabuds', 'Nova-Buds'],
      description: 'Product names are written as one word in PascalCase.',
      sourceId: 'src-brand-terminology',
      updatedAt: '2026-06-01',
    },
  ],
  offers: [
    {
      id: 'offer-festive-20',
      brandId: 'novatech',
      productId: 'novabuds',
      name: 'Festive Launch Offer',
      discountPercent: 20,
      validFrom: '2026-10-01',
      validUntil: '2026-10-20',
      sourceId: 'src-offer-records',
    },
    {
      id: 'offer-watch-10',
      brandId: 'novatech',
      productId: 'novawatch-s2',
      name: 'NovaWatch Winter Offer',
      discountPercent: 10,
      validFrom: '2026-10-15',
      validUntil: '2026-12-31',
      sourceId: 'src-offer-records',
    },
  ],
  sources: [
    {
      id: 'src-product-facts',
      label: 'Approved Product Facts',
      type: 'Product facts',
      owner: 'Product Marketing',
      description: 'Official specifications and MRP for every NovaTech SKU.',
      updatedAt: '2026-09-14',
    },
    {
      id: 'src-brand-terminology',
      label: 'Brand Terminology Rule',
      type: 'Brand rule',
      owner: 'Brand Team',
      description: 'Approved spellings for company and product names.',
      updatedAt: '2026-06-01',
    },
    {
      id: 'src-offer-records',
      label: 'Approved Offer Record',
      type: 'Offer record',
      owner: 'Growth & Promotions',
      description: 'Promotions approved by Legal, with validity windows.',
      updatedAt: '2026-10-01',
    },
  ],
}

/** Historical drafts analyzed on first load so the dashboard has realistic history. */
export const seedReviewInputs: (ReviewInput & { createdAt: string; fixAll?: boolean; approved?: boolean })[] = [
  {
    title: 'NovaWatch S2 — winter email',
    brandId: 'novatech',
    productId: 'novawatch-s2',
    content:
      'Meet NovaWatch S2 from NovaTech. Up to 120 hours on a single charge, for ₹6,999. Members get 10% off until 31 December.',
    createdAt: '2026-10-19T10:24:00.000Z',
    approved: true,
  },
  {
    title: 'NovaBuds — Instagram caption',
    brandId: 'novatech',
    productId: 'novabuds',
    content:
      'Novatech NovaBuds deliver 30-hour battery life. The #1 earbuds for gamers. Shop now for ₹2,499.',
    createdAt: '2026-10-17T15:02:00.000Z',
  },
  {
    title: 'NovaCharge 20K — product page blurb',
    brandId: 'novatech',
    productId: 'novacharge-20k',
    content: 'Power through the day with the Nova Tech NovaCharge 20K, priced at ₹1,799.',
    createdAt: '2026-10-12T08:45:00.000Z',
    fixAll: true,
  },
]
