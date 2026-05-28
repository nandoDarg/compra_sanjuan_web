'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from './auth-provider'

export default function Navbar() {
  const { user, loading } = useAuth()
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const isAuthRoute = pathname === '/login' || pathname === '/register'

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="rounded-xl bg-slate-900 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            CSJ
          </span>
          <span className="text-sm font-semibold text-slate-900 sm:text-base">
            Compra San Juan
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
        {loading && !isAuthRoute ? (
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-500">
            Cargando...
          </span>
        ) : !user ? (
          <>
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Explorar
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Registro
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/create-post"
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Publicar
            </Link>
            <Link
              href="/my-posts"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Mis publicaciones
            </Link>

            <button
              onClick={logout}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </>
        )}
        </div>
      </div>
    </nav>
  )
}
