'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

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
      alert('Registro correcto')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Marketplace
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Crear cuenta</h1>
        <p className="mt-2 text-sm text-slate-600">
          Registrate para empezar a publicar en minutos.
        </p>

        <div className="mt-6 flex flex-col gap-4">
        <input
          className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          onClick={handleRegister}
        >
          Registrarse
        </button>

        <p className="text-center text-sm text-slate-600">
          Ya tenes cuenta?{' '}
          <Link href="/login" className="font-medium text-slate-900 hover:underline">
            Inicia sesion
          </Link>
        </p>
        </div>
      </div>
    </div>
  )
}
