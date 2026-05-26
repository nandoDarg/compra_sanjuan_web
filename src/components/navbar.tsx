'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from './auth-provider'

export default function Navbar() {
  const { user, loading } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="flex items-center justify-between border-b p-4">
      <Link href="/">Compra San Juan</Link>

      <div className="flex items-center gap-4">
        {loading ? (
          <span className="text-sm text-gray-500">Cargando...</span>
        ) : !user ? (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Registro</Link>
          </>
        ) : (
          <>
            <Link href="/create-post">Publicar</Link>
            <span>{user.email}</span>

            <button onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
