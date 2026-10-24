
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OverviewDashboard } from '@/components/overview/overview-dashboard'

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims) {
    redirect('/login?mode=signup')
  }

  return <OverviewDashboard />
}
