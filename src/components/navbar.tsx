'use client'

import Link from 'next/link'
import { useCallback, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from './auth-provider'
import SearchBar from './ui/search-bar'

export default function Navbar() {
  const { user, loading } = useAuth()
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAuthRoute = pathname === '/login' || pathname === '/register'
  const isFeedRoute = pathname === '/'
  const queryFromUrl = searchParams.get('q') ?? ''
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateFeedQuery = useCallback(
    (nextValue: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (nextValue) {
        params.set('q', nextValue)
      } else {
        params.delete('q')
      }

      const nextQueryString = params.toString()
      router.replace(nextQueryString ? `/?${nextQueryString}` : '/')
    },
    [router, searchParams]
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      if (!isFeedRoute) {
        return
      }

      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current)
      }

      searchDebounceRef.current = window.setTimeout(() => {
        updateFeedQuery(value.trim())
      }, 300)
    },
    [isFeedRoute, updateFeedQuery]
  )

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center">
          <img
            src="/logo-navbar.svg"
            alt="tratohechoSJ"
            className="h-10 w-auto min-w-[190px] max-w-[280px] transition group-hover:opacity-95 sm:h-11"
          />
        </Link>

        {isFeedRoute ? (
          <div className="order-3 w-full sm:order-2 sm:mx-4 sm:flex-1 sm:max-w-2xl">
            <SearchBar
              key={queryFromUrl}
              initialValue={queryFromUrl}
              onChange={handleSearchChange}
            />
          </div>
        ) : null}

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3 sm:gap-3">
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
