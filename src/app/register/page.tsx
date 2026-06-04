'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics/tracking'
import { mapSupabaseAuthErrorMessage } from '@/lib/auth-errors'

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const normalizeEmail = (value: string) => value.trim().toLowerCase()

  const handleRegister = async () => {
    setError('')
    setSuccess('')

    const normalizedEmail = normalizeEmail(email)
    const normalizedPassword = password.trim()

    if (!normalizedEmail) {
      setError('Ingresa un email valido.')
      return
    }

    if (normalizedPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: normalizedPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    setLoading(false)

    if (error) {
      setError(mapSupabaseAuthErrorMessage(error.message))
    } else {
      trackEvent(ANALYTICS_EVENTS.USER_REGISTERED, {
        method: 'email_password',
        timestamp: new Date().toISOString(),
      })

      if (data.session) {
        router.push('/')
        return
      }

      setSuccess('Cuenta creada. Revisa tu email para confirmar la cuenta antes de iniciar sesion.')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-8 sm:px-6">
      <div className="thsj-panel w-full max-w-md p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
          Marketplace
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Crear cuenta</h1>
        <p className="mt-2 text-sm">
          Registrate para empezar a publicar en minutos.
        </p>

        <div className="mt-6 flex flex-col gap-4">
        <input
          className="thsj-input px-3 py-2.5"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="thsj-input px-3 py-2.5"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-(--success)">{success}</p> : null}

        <button
          className="thsj-btn thsj-btn-primary"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>

        <p className="text-center text-sm text-(--foreground-muted)">
          Ya tenes cuenta?{' '}
          <Link href="/login" className="font-semibold text-(--brand-secondary) hover:underline">
            Inicia sesion
          </Link>
        </p>
        </div>
      </div>
    </div>
  )
}
