import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function buildRedirectUrl(request: NextRequest, nextPath: string | null) {
  const safeNextPath = nextPath && nextPath.startsWith('/') ? nextPath : '/'
  return new URL(safeNextPath, request.url)
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextPath = requestUrl.searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(new URL('/login?auth_error=missing_code', request.url))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('auth_error', error.message)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.redirect(buildRedirectUrl(request, nextPath))
}
