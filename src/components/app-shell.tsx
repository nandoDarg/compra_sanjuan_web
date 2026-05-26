'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import Navbar from './navbar'

const PUBLIC_ROUTES = ['/login', '/register']

export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.replace('/login')
    }
  }, [isPublicRoute, loading, router, user])

  if (!isPublicRoute && (loading || !user)) {
    return (
      <>
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">Cargando sesion...</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
    </>
  )
}
