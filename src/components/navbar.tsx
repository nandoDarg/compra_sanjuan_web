'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from './auth-provider'

export default function Navbar() {
  const { user, loading } = useAuth()
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAuthRoute =
    pathname === '/login' || pathname === '/register' || pathname === '/reset-password' || pathname === '/auth/callback'
  const queryFromUrl = searchParams.get('q') ?? ''
  const [searchDraft, setSearchDraft] = useState(queryFromUrl)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setSearchDraft(queryFromUrl)
  }, [queryFromUrl])

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!menuContainerRef.current) {
        return
      }

      const target = event.target
      if (target instanceof Node && !menuContainerRef.current.contains(target)) {
        setIsMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

  const updateFeedQuery = useCallback(
    (nextValue: string) => {
      const params = new URLSearchParams(pathname === '/' ? searchParams.toString() : '')

      if (nextValue) {
        params.set('q', nextValue)
      } else {
        params.delete('q')
      }

      const nextQueryString = params.toString()
      const destination = nextQueryString ? `/?${nextQueryString}` : '/'

      if (pathname === '/') {
        router.replace(destination)
        return
      }

      router.push(destination)
    },
    [pathname, router, searchParams]
  )

  const executeSearch = useCallback(() => {
    updateFeedQuery(searchDraft.trim())
    setIsMenuOpen(false)
  }, [searchDraft, updateFeedQuery])

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') {
        return
      }

      event.preventDefault()
      executeSearch()
    },
    [executeSearch]
  )

  const logout = async () => {
    await supabase.auth.signOut()
    setIsMenuOpen(false)
    router.push('/')
  }

  const desktopActions = useMemo(() => {
    if (loading && !isAuthRoute) {
      return (
        <span className="thsj-chip rounded-lg px-3 py-1.5 text-sm">
          Cargando...
        </span>
      )
    }

    if (!user) {
      return (
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
      )
    }

    return (
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
        <Link
          href="/settings"
          className="thsj-btn thsj-btn-ghost"
        >
          Configuracion
        </Link>

        <button
          onClick={logout}
          className="thsj-btn thsj-btn-ghost"
        >
          Logout
        </button>
      </>
    )
  }, [isAuthRoute, loading, logout, user])

  return (
    <nav className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-3.5 md:hidden">
        <Link href="/" className="shrink-0">
          <img
            src="/icon.svg"
            alt="tratohechoSJ"
            className="h-[3.1rem] w-[3.1rem]"
          />
        </Link>

        <label className="relative min-w-0 flex-1">
          <input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar..."
            className="thsj-input w-full py-3.5 pl-3 pr-3 text-sm"
            aria-label="Buscar publicaciones"
          />
        </label>

        <button
          type="button"
          onClick={executeSearch}
          className="thsj-btn thsj-btn-ghost flex h-[3.1rem] w-[3.1rem] shrink-0 items-center justify-center p-0"
          aria-label="Ejecutar busqueda"
        >
          <svg viewBox="0 0 24 24" className="h-[2.25rem] w-[2.25rem]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        <div className="relative shrink-0" ref={menuContainerRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="thsj-btn thsj-btn-ghost flex h-[3.1rem] w-[3.1rem] items-center justify-center p-0"
            aria-label="Abrir menu"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            <svg viewBox="0 0 24 24" className="h-[2.25rem] w-[2.25rem]" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="6" r="2.35" />
              <circle cx="12" cy="12" r="2.35" />
              <circle cx="12" cy="18" r="2.35" />
            </svg>
          </button>

          {isMenuOpen ? (
            <div className="thsj-panel absolute right-0 top-12 z-40 w-52 rounded-xl border border-(--line) p-1.5 shadow-[0_12px_30px_rgba(16,32,51,0.18)]" role="menu">
              {!user ? (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-(--background-muted)"
                    role="menuitem"
                  >
                    Iniciar sesion
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-(--background-muted)"
                    role="menuitem"
                  >
                    Registrarse
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/create-post"
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-lg bg-(--brand-primary) px-3 py-2 text-sm font-semibold text-white hover:bg-(--brand-primary-strong)"
                    role="menuitem"
                  >
                    Publicar
                  </Link>
                  <Link
                    href="/my-posts"
                    onClick={() => setIsMenuOpen(false)}
                    className="mt-1 block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-(--background-muted)"
                    role="menuitem"
                  >
                    Mis avisos
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-(--background-muted)"
                    role="menuitem"
                  >
                    Cerrar sesion
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto hidden w-full max-w-7xl items-center gap-3 px-4 py-4 md:flex md:px-6 lg:px-8">
        <Link href="/" className="group flex items-center">
          <img
            src="/logo-navbar.svg"
            alt="tratohechoSJ"
            className="h-24 w-auto min-w-64 max-w-96 transition group-hover:opacity-95"
          />
        </Link>

        <div className="mx-4 flex w-full max-w-2xl flex-1 items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--foreground-muted)">⌕</span>
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar por titulo, descripcion o categoria..."
              className="thsj-input w-full py-3 pl-9 pr-3 text-sm"
              aria-label="Buscar publicaciones"
            />
          </label>
          <button
            type="button"
            onClick={executeSearch}
            className="thsj-btn thsj-btn-ghost h-12 px-4"
            aria-label="Ejecutar busqueda"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {desktopActions}
        </div>
      </div>
    </nav>
  )
}
