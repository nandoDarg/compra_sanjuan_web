'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function LoginPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Login correcto')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-80 flex-col gap-4">
        <input
          className="border p-2"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-2"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="bg-black p-2 text-white"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  )
}
