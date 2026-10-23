'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { createClient } from '@/lib/supabase/client'

const providers = [
  { id: 'google' as const, label: 'Continue with Google', mark: 'G' },
  { id: 'azure' as const, label: 'Continue with Microsoft', mark: '▦' },
  { id: 'apple' as const, label: 'Continue with Apple', mark: '●' },
]

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext())}`
  const safeNext = () => {
    const next = searchParams.get('next')
    return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
  }

  async function handleEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const supabase = createClient()
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl() },
        })
        if (error) throw error
        if (data.session) window.location.assign(safeNext())
        else setMessage('Check your email for a confirmation link. After confirming, you can sign in to ProofBrand.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.assign(safeNext())
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleOAuth(provider: 'google' | 'azure' | 'apple') {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl(),
          ...(provider === 'azure' ? { scopes: 'email' } : {}),
        },
      })
      if (error) throw error
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start provider sign-in.')
      setBusy(false)
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#f7f8fc] px-4 py-10 text-slate-900">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.13),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,0.10),transparent_38%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_28px_100px_-45px_rgba(30,41,59,0.32)] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="hidden flex-col justify-between bg-[#171b35] p-10 text-white lg:flex xl:p-12">
          <div><Logo showAttribution={false} /></div>
          <div className="max-w-md py-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-indigo-100"><Sparkles className="size-3.5" /> Evidence-first brand governance</div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">Make every brand claim earn its place.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">Review content against approved facts, guidelines and offers—with findings that trace back to evidence.</p>
            <div className="mt-9 flex items-center gap-3 text-sm text-slate-300"><ShieldCheck className="size-5 text-emerald-300" /> Built for confident, accountable publishing</div>
          </div>
          <p className="text-xs text-slate-400">ProofBrand by NS Technologies</p>
        </section>

        <section className="px-6 py-8 sm:px-10 sm:py-10 lg:px-11 xl:px-14 xl:py-12">
          <div className="mb-8 flex items-center justify-between lg:hidden"><Logo showAttribution={false} /><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">Secure access</span></div>
          <div className="mb-7">
            <p className="text-sm font-semibold text-indigo-600">Welcome to ProofBrand</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{mode === 'signin' ? 'Sign in to your account' : 'Create your account'}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{mode === 'signin' ? 'Pick up where your team left off.' : 'Start reviewing content with evidence-backed brand checks.'}</p>
          </div>

          <div className="grid gap-2.5">
            {providers.map((provider) => <button key={provider.id} type="button" disabled={busy} onClick={() => handleOAuth(provider.id)} className="flex h-11 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"><span className="flex size-5 items-center justify-center font-semibold text-slate-800">{provider.mark}</span>{provider.label}</button>)}
          </div>

          <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-xs text-slate-400">or continue with email</span><div className="h-px flex-1 bg-slate-200" /></div>

          <form onSubmit={handleEmail} className="space-y-4">
            <div className="space-y-1.5"><label htmlFor="email" className="text-sm font-medium text-slate-700">Work email</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" /></div>
            <div className="space-y-1.5"><label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label><div className="relative"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>
            {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
            <button type="submit" disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}{!busy && <ArrowRight className="size-4" />}</button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">{mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}<button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage('') }} className="font-semibold text-indigo-600 hover:text-indigo-700">{mode === 'signin' ? 'Sign up' : 'Sign in'}</button></p>
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">By continuing, you agree to use ProofBrand in accordance with your organisation's policies.</p>
        </section>
      </div>
    </main>
  )
}
