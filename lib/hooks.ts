'use client'

import useSWR, { mutate } from 'swr'
import { getGuidelines, getReviewById, getReviews } from './services'

export function useGuidelines() {
  return useSWR('guidelines', getGuidelines)
}

export function useReviews() {
  return useSWR('reviews', getReviews)
}

export function useReview(id: string | null) {
  return useSWR(id ? ['review', id] : null, () => getReviewById(id!))
}

export function revalidateReviews() {
  return mutate((key) => key === 'reviews' || (Array.isArray(key) && key[0] === 'review'))
}

export function revalidateGuidelines() {
  return mutate('guidelines')
}
