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
    <nav className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--brand-accent-soft)] transition group-hover:-translate-y-0.5 group-hover:shadow-md">
            <img src="/brand-mark-thsj.svg" alt="THSJ" className="h-8 w-8" />
          </span>
          <img
            src="/logo-navbar.svg"
            alt="tratohechoSJ"
            className="h-9 w-auto min-w-[170px] max-w-[240px] transition group-hover:opacity-95 sm:h-10"
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
        {loading && !isAuthRoute ? (
          <span className="thsj-chip rounded-lg px-3 py-1.5 text-sm">
            Cargando...
          </span>
        ) : !user ? (
          <>
            <Link
              href="/"
              className="thsj-btn thsj-btn-ghost"
            >
              Explorar
            </Link>
            <Link
              href="/login"
              className="thsj-btn thsj-btn-ghost"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="thsj-btn thsj-btn-primary"
            >
              Registro
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/create-post"
              className="thsj-btn thsj-btn-primary"
            >
              Publicar
            </Link>
            <Link
              href="/my-posts"
              className="thsj-btn thsj-btn-ghost"
            >
              Mis publicaciones
            </Link>

            <button
              onClick={logout}
              className="thsj-btn thsj-btn-ghost"
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
