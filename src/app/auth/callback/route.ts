import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { buildProfilePayload, normalizeEmail, normalizeText, sanitizeWhatsAppNumber } from '@/lib/user-profile'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function buildRedirectUrl(request: NextRequest, nextPath: string | null) {
  const safeNextPath = nextPath && nextPath.startsWith('/') ? nextPath : '/'
  return new URL(safeNextPath, request.url)
}

function resolveNextPath(nextPath: string | null, authType: string | null) {
  if (nextPath && nextPath.startsWith('/')) {
    return nextPath
  }

  if (authType === 'recovery') {
    return '/reset-password'
  }

  return '/'
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextPath = requestUrl.searchParams.get('next')
  const authType = requestUrl.searchParams.get('type')
  const resolvedNextPath = resolveNextPath(nextPath, authType)

  if (!code) {
    const redirectUrl = new URL(resolvedNextPath, request.url)
    redirectUrl.searchParams.set('auth_error', 'missing_code')
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

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const redirectUrl = new URL(resolvedNextPath, request.url)
    redirectUrl.searchParams.set('auth_error', error.message)
    return NextResponse.redirect(redirectUrl)
  }

  const { data: userResult } = await supabase.auth.getUser()
  const user = userResult.user

  if (user) {
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
    const fullName = normalizeText(
      String(metadata.full_name ?? metadata.display_name ?? user.email ?? 'Usuario')
    )
    const profilePayload = buildProfilePayload(user.id, {
      fullName,
      whatsappNumber: sanitizeWhatsAppNumber(String(metadata.whatsapp_number ?? '')),
      domicile: normalizeText(String(metadata.domicile ?? '')),
      recoveryEmail: normalizeEmail(String(metadata.recovery_email ?? user.email ?? '')),
    })

    await supabase.from('profiles').upsert(profilePayload, { onConflict: 'user_id' })
  }

  return NextResponse.redirect(buildRedirectUrl(request, resolvedNextPath))
}
