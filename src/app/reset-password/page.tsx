'use client'

import Link from 'next/link'
import { FormEvent, Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient, createRecoveryClient } from '@/lib/supabase-client'
import { mapSupabaseAuthErrorMessage } from '@/lib/auth-errors'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-8 sm:px-6">
          <div className="thsj-panel w-full max-w-md p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
              Marketplace
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Recuperar contraseña</h1>
            <div className="mt-6 rounded-2xl border border-(--line) bg-(--background-muted) px-4 py-5 text-sm text-(--foreground-muted)">
              Verificando enlace de recuperacion...
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const supabase = useState(() => createClient())[0]
  // Implicit flow client: prevents pkce_ prefix in token_hash so the server
  // can verify it from any browser/device via verifyOtp in /auth/confirm
  const supabaseRecovery = useState(() => createRecoveryClient())[0]
  const router = useRouter()
  const searchParams = useSearchParams()

  const [checkingSession, setCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [hasValidToken, setHasValidToken] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryDisplayName, setRecoveryDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')

  const normalizeEmail = (value: string) => value.trim().toLowerCase()
  const getRecoveryRedirect = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`

  const syncRecoveryIdentity = (sessionEmail?: string | null, metadata?: unknown) => {
    setRecoveryEmail(sessionEmail ?? '')

    if (!metadata || typeof metadata !== 'object') {
      setRecoveryDisplayName('')
      return
    }

    const candidate = (metadata as Record<string, unknown>).display_name
    setRecoveryDisplayName(typeof candidate === 'string' ? candidate : '')
  }

  useEffect(() => {
    let active = true

    const syncSession = async () => {
      // Capturar token y type de los searchParams
      const tokenFromUrl = searchParams.get('token')
      const typeFromUrl = searchParams.get('type')

      // Validar que sea un recovery token
      const isValidRecoveryUrl = tokenFromUrl && typeFromUrl === 'recovery'
      if (isValidRecoveryUrl) {
        setHasValidToken(true)
        // If the recovery token is already present, allow showing the form
        // immediately while session resolution continues in background.
        setCheckingSession(false)
      }

      try {
        const { data } = await supabase.auth.getSession()

        if (!active) {
          return
        }

        setHasRecoverySession(Boolean(data.session))
        syncRecoveryIdentity(data.session?.user.email, data.session?.user.user_metadata)
      } catch {
        if (!active) {
          return
        }

        // Do not lock the screen in checking mode if session lookup fails.
        setHasRecoverySession(false)
      } finally {
        if (!active) {
          return
        }

        setCheckingSession(false)
      }
    }

    void syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasRecoverySession(Boolean(session))
      syncRecoveryIdentity(session?.user.email, session?.user.user_metadata)
      setCheckingSession(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase, searchParams])

  useEffect(() => {
    const authError = searchParams.get('auth_error')

    if (!authError) {
      return
    }

    setError(mapSupabaseAuthErrorMessage(authError))
  }, [searchParams])

  const handleSendResetEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setInfo('')

    const normalizedEmail = normalizeEmail(email)

    if (!normalizedEmail) {
      setError('Ingresa tu email para enviar el enlace de recuperacion.')
      return
    }

    setLoading(true)

    const { error: resetError } = await supabaseRecovery.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: getRecoveryRedirect(),
    })

    setLoading(false)

    if (resetError) {
      setError(mapSupabaseAuthErrorMessage(resetError.message))
      return
    }

    setInfo('Te enviamos un enlace a tu correo. Haz clic en el enlace para continuar (revisa también spam).')
  }

  const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setInfo('')

    const trimmedPassword = newPassword.trim()
    const trimmedConfirmation = confirmPassword.trim()

    if (!trimmedPassword || !trimmedConfirmation) {
      setError('Completá ambos campos de contraseña.')
      return
    }

    if (trimmedPassword !== trimmedConfirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (trimmedPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password: trimmedPassword,
    })

    setLoading(false)

    if (updateError) {
      setError(mapSupabaseAuthErrorMessage(updateError.message))
      return
    }

    setInfo('Tu contraseña fue actualizada. Ahora podes iniciar sesion de nuevo.')
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isRecoveringPassword = !checkingSession && (hasRecoverySession || hasValidToken)

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-8 sm:px-6">
      <div className="thsj-panel w-full max-w-md p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
          Marketplace
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          {isRecoveringPassword ? 'Crear nueva contraseña' : 'Recuperar contraseña'}
        </h1>
        <p className="mt-2 text-sm">
          {checkingSession
            ? 'Verificando tu enlace...'
            : isRecoveringPassword
              ? 'Elegí una nueva contraseña segura para tu cuenta.'
              : 'Escribí tu email registrado y te enviaremos un enlace para restablecerla.'}
        </p>

        {checkingSession ? (
          <div className="mt-6 rounded-2xl border border-(--line) bg-(--background-muted) px-4 py-5 text-sm text-(--foreground-muted)">
            Verificando enlace de recuperacion...
          </div>
        ) : isRecoveringPassword ? (
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleUpdatePassword}>
            <div className="rounded-2xl border border-(--line) bg-(--background-muted) px-3 py-2 text-sm text-(--foreground-muted)">
              <p>
                <span className="font-semibold text-foreground">Cuenta:</span>{' '}
                {recoveryDisplayName ? `${recoveryDisplayName} · ` : ''}
                {recoveryEmail || 'No disponible'}
              </p>
            </div>

            <input
              className="thsj-input px-3 py-2.5"
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />

            <input
              className="thsj-input px-3 py-2.5"
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {info ? <p className="text-sm text-(--success)">{info}</p> : null}

            <button className="thsj-btn thsj-btn-primary" type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>

            <Link href="/login" className="text-center text-sm font-semibold text-(--brand-secondary) hover:underline">
              Volver al login
            </Link>
          </form>
        ) : (
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSendResetEmail}>
            <input
              className="thsj-input px-3 py-2.5"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {info ? <p className="text-sm text-(--success)">{info}</p> : null}

            <button className="thsj-btn thsj-btn-primary" type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace de recuperacion'}
            </button>

            <Link href="/login" className="text-center text-sm font-semibold text-(--brand-secondary) hover:underline">
              Volver al login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}