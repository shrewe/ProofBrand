
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(
        cookiesToSet: {
          name: string
          value: string
          options?: CookieOptions
        }[],
      ) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({ request })

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const isLoginRoute = request.nextUrl.pathname.startsWith('/login')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')

  if (!data?.claims && !isLoginRoute && !isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (data?.claims && isLoginRoute) {
    const redirectUrl = request.nextUrl.clone()
    const next = request.nextUrl.searchParams.get('next')
    redirectUrl.pathname =
      next?.startsWith('/') && !next.startsWith('//') ? next : '/'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
