'use client'

import { Suspense, type ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import Navbar from './navbar'

const PUBLIC_ROUTES = ['/', '/login', '/register']

function isPublicPath(pathname: string) {
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true
  }

  // Public detail pages: /post/[id]
  return pathname.startsWith('/post/')
}

export default function AppShell({
  children,
}: {
  children: ReactNode
}) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isPublicRoute = isPublicPath(pathname)

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.replace('/login')
    }
  }, [isPublicRoute, loading, router, user])

  if (!isPublicRoute && (loading || !user)) {
    return (
      <>
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="thsj-panel px-6 py-10 text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full bg-[var(--background-muted)]" />
            <p className="text-sm text-[var(--foreground-muted)]">Cargando sesion...</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </>
  )
}
