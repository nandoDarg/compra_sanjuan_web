import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getSafeNextPath(nextPath: string | null) {
  return nextPath && nextPath.startsWith('/') ? nextPath : '/'
}

function getDefaultPathByType(type: EmailOtpType | null) {
  if (type === 'recovery') {
    return '/reset-password'
  }

  return '/login'
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const requestedNextPath = requestUrl.searchParams.get('next')
  const nextPath = requestedNextPath
    ? getSafeNextPath(requestedNextPath)
    : getDefaultPathByType(type)

  if (!tokenHash || !type) {
    const redirectUrl = new URL(nextPath, request.url)
    redirectUrl.searchParams.set('auth_error', 'missing_token')
    return NextResponse.redirect(redirectUrl)
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

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error) {
    const redirectUrl = new URL(nextPath, request.url)
    redirectUrl.searchParams.set('auth_error', error.message)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.redirect(new URL(nextPath, request.url))
}
