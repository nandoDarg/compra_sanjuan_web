import { NextRequest, NextResponse } from 'next/server'

function getSanitizedCurrentPath(request: NextRequest) {
  const params = new URLSearchParams(request.nextUrl.searchParams)
  params.delete('code')

  const query = params.toString()
  return `${request.nextUrl.pathname}${query ? `?${query}` : ''}`
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (pathname.startsWith('/auth/callback') || pathname.startsWith('/auth/confirm')) {
    return NextResponse.next()
  }

  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.next()
  }

  const target = new URL('/auth/callback', request.url)
  target.searchParams.set('code', code)

  const providedNext = searchParams.get('next')
  if (providedNext && providedNext.startsWith('/')) {
    target.searchParams.set('next', providedNext)
  } else if (pathname === '/') {
    // Refuerzo para recovery links mal configurados que llegan a Home con ?code=...
    target.searchParams.set('next', '/reset-password')
  } else {
    target.searchParams.set('next', getSanitizedCurrentPath(request))
  }

  const type = searchParams.get('type')
  if (type) {
    target.searchParams.set('type', type)
  }

  return NextResponse.redirect(target)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
