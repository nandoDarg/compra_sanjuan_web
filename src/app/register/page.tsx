'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics/tracking'

export default function RegisterPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      trackEvent(ANALYTICS_EVENTS.USER_REGISTERED, {
        method: 'email_password',
        timestamp: new Date().toISOString(),
      })
      alert('Registro correcto')
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
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="thsj-input px-3 py-2.5"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="thsj-btn thsj-btn-primary"
          onClick={handleRegister}
        >
          Registrarse
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
