'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics/tracking'
import { mapSupabaseAuthErrorMessage } from '@/lib/auth-errors'
import { createClient } from '@/lib/supabase-client'
import {
  buildProfilePayload,
  normalizeEmail,
  normalizeText,
  sanitizeWhatsAppNumber,
} from '@/lib/user-profile'

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [domicile, setDomicile] = useState('')
  const [email, setEmail] = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const getAuthCallbackRedirect = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent('/')}`

  const handleRegister = async () => {
    setError('')
    setSuccess('')

    const normalizedFullName = normalizeText(fullName)
    const normalizedWhatsapp = sanitizeWhatsAppNumber(whatsappNumber)
    const normalizedDomicile = normalizeText(domicile)
    const normalizedEmail = normalizeEmail(email)
    const normalizedRecoveryEmail = normalizeEmail(recoveryEmail)
    const normalizedPassword = password.trim()

    if (normalizedFullName.length < 5) {
      setError('Ingresa tu nombre completo.')
      return
    }

    if (normalizedWhatsapp.length < 8) {
      setError('Ingresa un numero de WhatsApp valido.')
      return
    }

    if (!normalizedDomicile) {
      setError('Ingresa tu domicilio.')
      return
    }

    if (!normalizedEmail) {
      setError('Ingresa tu email.')
      return
    }

    if (!normalizedRecoveryEmail) {
      setError('Ingresa tu email de recuperacion.')
      return
    }

    if (normalizedPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: normalizedPassword,
      options: {
        emailRedirectTo: getAuthCallbackRedirect(),
        data: {
          display_name: normalizedFullName,
          full_name: normalizedFullName,
          whatsapp_number: normalizedWhatsapp,
          domicile: normalizedDomicile,
          recovery_email: normalizedRecoveryEmail,
        },
      },
    })

    setLoading(false)

    if (authError) {
      setError(mapSupabaseAuthErrorMessage(authError.message))
      return
    }

    if (data.user?.id) {
      const profilePayload = buildProfilePayload(data.user.id, {
        fullName: normalizedFullName,
        whatsappNumber: normalizedWhatsapp,
        domicile: normalizedDomicile,
        recoveryEmail: normalizedRecoveryEmail,
      })

      await supabase.from('profiles').upsert(profilePayload, {
        onConflict: 'user_id',
      })
    }

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

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-8 sm:px-6">
      <div className="thsj-panel w-full max-w-md p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
          Marketplace
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Crear cuenta</h1>
        <p className="mt-2 text-sm">
          Registrate para empezar a publicar en minutos. Todos los datos de contacto son obligatorios.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <input
            className="thsj-input px-3 py-2.5"
            placeholder="Nombre completo"
            value={fullName}
            minLength={5}
            required
            onChange={(event) => setFullName(event.target.value)}
          />

          <input
            className="thsj-input px-3 py-2.5"
            placeholder="WhatsApp"
            type="tel"
            value={whatsappNumber}
            required
            onChange={(event) => setWhatsappNumber(event.target.value)}
          />

          <input
            className="thsj-input px-3 py-2.5"
            placeholder="Domicilio"
            value={domicile}
            required
            onChange={(event) => setDomicile(event.target.value)}
          />

          <input
            className="thsj-input px-3 py-2.5"
            placeholder="Email"
            type="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
          />

          <input
            className="thsj-input px-3 py-2.5"
            placeholder="Email de recuperacion"
            type="email"
            value={recoveryEmail}
            required
            onChange={(event) => setRecoveryEmail(event.target.value)}
          />

          <input
            className="thsj-input px-3 py-2.5"
            type="password"
            placeholder="Contraseña"
            value={password}
            minLength={6}
            required
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            type="button"
            onClick={handleRegister}
            disabled={loading}
            className="thsj-btn thsj-btn-primary h-12 w-full"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-(--danger)">{error}</p>
          ) : null}

          {success ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-(--success)">
              {success}
            </p>
          ) : null}

          <p className="text-sm text-(--foreground-muted)">
            ¿Ya tenes cuenta?{' '}
            <Link href="/login" className="font-semibold text-(--brand-primary)">
              Iniciar sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
