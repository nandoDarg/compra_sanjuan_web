'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase-client'

type ProfileRow = {
  display_name: string
}

function clearLocalAccountState() {
  if (typeof window === 'undefined') {
    return
  }

  const keysToRemove: string[] = []

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)

    if (key?.startsWith('thsj:')) {
      keysToRemove.push(key)
    }
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key)
  }
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { user, loading } = useAuth()

  const [displayName, setDisplayName] = useState('Usuario')
  const [confirmationText, setConfirmationText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      return
    }

    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle<ProfileRow>()

      if (data?.display_name?.trim()) {
        setDisplayName(data.display_name.trim())
        return
      }

      const fallbackName = user.email?.split('@')[0]?.trim()

      if (fallbackName) {
        setDisplayName(fallbackName)
      }
    }

    void loadProfile()
  }, [supabase, user])

  const handleDeleteAccount = async () => {
    if (!user) {
      setErrorMsg('Necesitas una sesion activa para eliminar la cuenta.')
      return
    }

    if (confirmationText.trim() !== 'ELIMINAR') {
      setErrorMsg('Escribe ELIMINAR exactamente para habilitar el borrado permanente.')
      return
    }

    const confirmed = window.confirm(
      'Esta accion eliminara permanentemente tu cuenta, tus publicaciones y sus imagenes. Deseas continuar?'
    )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    setErrorMsg(null)
    setSuccessMsg('Eliminando cuenta...')

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ confirmation: confirmationText.trim() }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null

      if (!response.ok) {
        setSuccessMsg(null)
        setErrorMsg(payload?.error ?? 'Error al eliminar la cuenta.')
        setIsDeleting(false)
        return
      }

      setSuccessMsg(payload?.message ?? 'Cuenta eliminada correctamente.')
      clearLocalAccountState()

      try {
        await supabase.auth.signOut()
      } finally {
        router.replace('/login?account_deleted=1')
      }
    } catch {
      setSuccessMsg(null)
      setErrorMsg('Error al eliminar la cuenta.')
      setIsDeleting(false)
    }
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-6 py-6 sm:py-8">
      <div className="thsj-panel p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
          Perfil / Configuracion
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
          Ajustes de cuenta
        </h1>
        <p className="mt-2 text-sm">
          Revisa el estado de tu cuenta y gestiona acciones sensibles desde un unico lugar.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="thsj-panel p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
            Cuenta
          </p>
          <h2 className="mt-2 text-xl font-bold text-foreground">Resumen del perfil</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-(--line) bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)">
                Nombre visible
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {loading ? 'Cargando...' : displayName}
              </p>
            </div>

            <div className="rounded-2xl border border-(--line) bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)">
                Email
              </p>
              <p className="mt-2 break-all text-base font-semibold text-foreground">
                {loading ? 'Cargando...' : (user?.email ?? 'Sin email')}
              </p>
            </div>
          </div>
        </div>

        <aside className="thsj-panel border border-[#f0b8b6] bg-[#fff7f6] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--danger)">
            Zona de peligro
          </p>
          <h2 className="mt-2 text-xl font-bold text-foreground">Eliminar mi cuenta</h2>
          <p className="mt-3 text-sm text-(--foreground-muted)">
            Esta accion elimina permanentemente tu perfil, tus publicaciones, sus datos vehiculares y las imagenes alojadas en Storage.
          </p>

          <div className="mt-5 rounded-2xl border border-[#f0d3d1] bg-white/80 p-4 text-sm text-(--foreground-muted)">
            <p>
              Para continuar, escribe <span className="font-semibold text-(--danger)">ELIMINAR</span> y confirma en el siguiente paso.
            </p>
          </div>

          <label className="mt-5 flex flex-col gap-2 text-sm font-semibold text-foreground">
            Confirmacion obligatoria
            <input
              type="text"
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value.toUpperCase())}
              placeholder="Escribe ELIMINAR"
              className="thsj-input px-3 py-2.5"
              disabled={isDeleting}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>

          {successMsg ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-(--success)">
              {successMsg}
            </p>
          ) : null}

          {errorMsg ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-(--danger)">
              {errorMsg}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeleting || confirmationText.trim() !== 'ELIMINAR'}
            className="thsj-btn thsj-btn-danger mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? 'Eliminando cuenta...' : 'Eliminar mi cuenta'}
          </button>
        </aside>
      </div>
    </section>
  )
}