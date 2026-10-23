import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error('Supabase is not configured yet. Add the project URL and publishable key to .env.local, then restart the development server.')
  }
  return createBrowserClient(url, key)
}
