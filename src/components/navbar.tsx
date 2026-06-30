'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const mobilePublishHref = user ? '/create-post' : '/login?next=%2Fcreate-post'
  const [mounted, setMounted] = useState(false)
  const [searchDraft, setSearchDraft] = useState(queryFromUrl)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement | null>(null)
  const accountContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchDraft(queryFromUrl)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [queryFromUrl])

  useEffect(() => {
    if (!isMenuOpen && !isAccountOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      if (isMenuOpen && menuContainerRef.current && !menuContainerRef.current.contains(target)) {
        setIsMenuOpen(false)
      }

      if (isAccountOpen && accountContainerRef.current && !accountContainerRef.current.contains(target)) {
        setIsAccountOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        setIsAccountOpen(false)
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
  }, [isAccountOpen, isMenuOpen])

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

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setIsMenuOpen(false)
    setIsAccountOpen(false)
    router.push('/')
  }, [router, supabase])

  const closeAccountDropdown = useCallback(() => {
    setIsAccountOpen(false)
  }, [])

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
            href="/login?next=%2Fcreate-post"
            className="thsj-btn thsj-btn-primary"
          >
            Publicar
          </Link>
          <Link
            href="/login"
            className="thsj-btn thsj-btn-ghost"
          >
            Ingresar
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
        <div className="relative" ref={accountContainerRef}>
          <button
            type="button"
            onClick={() => {
              setIsAccountOpen((open) => !open)
              setIsMenuOpen(false)
            }}
            className="thsj-btn thsj-btn-ghost inline-flex items-center gap-2"
            aria-label="Abrir menu de cuenta"
            aria-haspopup="menu"
            aria-expanded={isAccountOpen}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21a8 8 0 1 0-16 0" />
              <circle cx="12" cy="8" r="4" />
            </svg>
            Cuenta
          </button>

          {isAccountOpen ? (
            <div className="thsj-panel absolute right-0 top-12 z-40 w-60 rounded-xl border border-(--line) p-1.5 shadow-[0_12px_30px_rgba(16,32,51,0.18)]" role="menu">
              <Link
                href="/configuracion"
                onClick={closeAccountDropdown}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-(--background-muted)"
                role="menuitem"
              >
                Configuracion y seguridad
              </Link>

              <div className="my-1 border-t border-(--line)" />

              <Link
                href="/favoritos"
                onClick={closeAccountDropdown}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-(--background-muted)"
                role="menuitem"
              >
                Favoritos
              </Link>

              <Link
                href="/my-posts"
                onClick={closeAccountDropdown}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-(--background-muted)"
                role="menuitem"
              >
                Mis publicaciones
              </Link>

              <div className="my-1 border-t border-(--line)" />

              <button
                type="button"
                onClick={logout}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-(--danger) hover:bg-red-50"
                role="menuitem"
              >
                Cerrar sesion
              </button>
            </div>
          ) : null}
        </div>
      </>
    )
  }, [closeAccountDropdown, isAuthRoute, isAccountOpen, loading, logout, user])

  return (
    <nav className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-3.5 md:hidden">
        <Link href="/" className="shrink-0">
          <Image src="/icon.svg" alt="tratohechoSJ" width={50} height={50} className="h-[3.1rem] w-[3.1rem]" priority />
        </Link>

        <form
          role="search"
          className="min-w-0 flex-1"
          onSubmit={(e) => {
            e.preventDefault()
            executeSearch()
            ;(document.activeElement as HTMLElement)?.blur()
          }}
        >
          <input
            type="search"
            enterKeyHint="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Buscar..."
            className="thsj-input w-full py-3.5 pl-3 pr-3 text-sm"
            aria-label="Buscar publicaciones"
          />
        </form>

        <div className="relative shrink-0" ref={menuContainerRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="thsj-btn thsj-btn-ghost flex h-[3.1rem] w-[3.1rem] items-center justify-center p-0"
            aria-label="Abrir menu"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="6" r="2.35" />
              <circle cx="12" cy="12" r="2.35" />
              <circle cx="12" cy="18" r="2.35" />
            </svg>
          </button>

          {isMenuOpen ? (
            <div className="thsj-panel absolute right-0 top-12 z-40 w-56 rounded-xl border border-(--line) p-1.5 shadow-[0_12px_30px_rgba(16,32,51,0.18)]" role="menu">
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

                  <div className="my-1 border-t border-(--line)" />

                  <Link
                    href="/configuracion"
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-(--background-muted)"
                    role="menuitem"
                  >
                    Configuracion y seguridad
                  </Link>
                  <Link
                    href="/favoritos"
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-(--background-muted)"
                    role="menuitem"
                  >
                    Favoritos
                  </Link>
                  <Link
                    href="/my-posts"
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-(--background-muted)"
                    role="menuitem"
                  >
                    Mis publicaciones
                  </Link>

                  <div className="my-1 border-t border-(--line)" />

                  <button
                    type="button"
                    onClick={logout}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-(--danger) hover:bg-red-50"
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
          <Image
            src="/logo-navbar.svg"
            alt="tratohechoSJ"
            width={384}
            height={96}
            className="h-24 w-auto min-w-64 max-w-96 transition group-hover:opacity-95"
            priority
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

      {mounted && !isAuthRoute && pathname !== '/create-post'
        ? createPortal(
            <Link
              href={mobilePublishHref}
              className="fixed bottom-5 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(255,122,26,0.72)] bg-[rgba(255,122,26,0.5)] text-[rgb(7,94,90)] shadow-[0_10px_24px_rgba(16,32,51,0.18)] transition hover:scale-105 hover:bg-[rgba(255,122,26,0.62)] md:hidden"
              aria-label={user ? 'Publicar' : 'Iniciar sesion para publicar'}
              title={user ? 'Publicar' : 'Iniciar sesion para publicar'}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Link>,
            document.body
          )
        : null}
    </nav>
  )
}
