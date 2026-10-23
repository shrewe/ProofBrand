import { Suspense } from 'react'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#f7f8fc] text-sm text-slate-500">
          Loading sign-in…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}