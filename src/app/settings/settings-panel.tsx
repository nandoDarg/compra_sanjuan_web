'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase-client'
import {
  buildProfilePayload,
  normalizeEmail,
  normalizeText,
  resolveProfileSnapshot,
  sanitizeWhatsAppNumber,
} from '@/lib/user-profile'

type ProfileRow = {
  display_name: string | null
  full_name: string | null
  whatsapp_number: string | null
  domicile: string | null
  recovery_email: string | null
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

export default function SettingsPanel() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const [fullName, setFullName] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [domicile, setDomicile] = useState('')
  const [accountEmail, setAccountEmail] = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [changePassword, setChangePassword] = useState('')
  const [repeatChangePassword, setRepeatChangePassword] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const activeSection = searchParams.get('section')

  useEffect(() => {
    if (!user) {
      return
    }

    const loadProfile = async () => {
      setProfileLoading(true)

      const { data } = await supabase
        .from('profiles')
        .select('display_name,full_name,whatsapp_number,domicile,recovery_email')
        .eq('user_id', user.id)
        .maybeSingle<ProfileRow>()

      const snapshot = resolveProfileSnapshot({
        profile: data,
        metadata: (user.user_metadata ?? {}) as Record<string, unknown>,
        fallbackEmail: user.email,
      })

      setFullName(snapshot.fullName)
      setWhatsappNumber(snapshot.whatsappNumber)
      setDomicile(snapshot.domicile)
      setAccountEmail(user.email ?? snapshot.recoveryEmail)
      setRecoveryEmail(snapshot.recoveryEmail)
      setProfileLoading(false)
    }

    void loadProfile()
  }, [supabase, user])

  useEffect(() => {
    if (!activeSection || typeof window === 'undefined') {
      return
    }

    const target = document.getElementById(activeSection)
    if (!target) {
      return
    }

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [activeSection])

  const handleSaveProfile = async () => {
    if (!user) {
      setErrorMsg('Necesitas una sesion activa para guardar cambios.')
      return
    }

    const normalizedFullName = normalizeText(fullName)
    const normalizedWhatsapp = sanitizeWhatsAppNumber(whatsappNumber)
    const normalizedDomicile = normalizeText(domicile)
    const normalizedAccountEmail = normalizeEmail(accountEmail)
    const normalizedRecoveryEmail = normalizeEmail(recoveryEmail)
    const trimmedPassword = newPassword.trim()

    if (normalizedFullName.length < 5) {
      setErrorMsg('Ingresa tu nombre completo.')
      return
    }

    if (normalizedWhatsapp.length < 8) {
      setErrorMsg('Ingresa un numero de WhatsApp valido.')
      return
    }

    if (!normalizedDomicile) {
      setErrorMsg('Ingresa tu domicilio.')
      return
    }

    if (!normalizedAccountEmail) {
      setErrorMsg('Ingresa tu email principal.')
      return
    }

    if (!normalizedRecoveryEmail) {
      setErrorMsg('Ingresa tu email de recuperacion.')
      return
    }

    if (trimmedPassword && trimmedPassword.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    setIsSaving(true)
    setErrorMsg(null)
    setSuccessMsg('Guardando cambios...')

    try {
      const profilePayload = buildProfilePayload(user.id, {
        fullName: normalizedFullName,
        whatsappNumber: normalizedWhatsapp,
        domicile: normalizedDomicile,
        recoveryEmail: normalizedRecoveryEmail,
      })

      const { error: profileError } = await supabase.from('profiles').upsert(profilePayload, {
        onConflict: 'user_id',
      })

      if (profileError) {
        setSuccessMsg(null)
        setErrorMsg(profileError.message)
        setIsSaving(false)
        return
      }

      const authData: Record<string, string> = {
        display_name: normalizedFullName,
        full_name: normalizedFullName,
        whatsapp_number: normalizedWhatsapp,
        domicile: normalizedDomicile,
        recovery_email: normalizedRecoveryEmail,
      }

      const authUpdatePayload: {
        email?: string
        password?: string
        data: Record<string, string>
      } = {
        data: authData,
      }

      const currentEmail = normalizeEmail(user.email ?? '')
      if (normalizedAccountEmail !== currentEmail) {
        authUpdatePayload.email = normalizedAccountEmail
      }

      if (trimmedPassword) {
        authUpdatePayload.password = trimmedPassword
      }

      const { error: authError } = await supabase.auth.updateUser(authUpdatePayload)

      if (authError) {
        setSuccessMsg(null)
        setErrorMsg(authError.message)
        setIsSaving(false)
        return
      }

      setSuccessMsg(
        normalizedAccountEmail !== currentEmail
          ? 'Cambios guardados. Revisa tu email para confirmar el nuevo correo.'
          : 'Cambios guardados correctamente.'
      )
      setNewPassword('')
    } catch {
      setSuccessMsg(null)
      setErrorMsg('No se pudieron guardar los cambios.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user) {
      setErrorMsg('Necesitas una sesion activa para cambiar la contraseña.')
      return
    }

    if (!currentPassword.trim()) {
      setErrorMsg('Ingresa tu contraseña actual.')
      return
    }

    const nextPassword = changePassword.trim()
    const repeatPassword = repeatChangePassword.trim()

    if (nextPassword.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (nextPassword !== repeatPassword) {
      setErrorMsg('La nueva contraseña y su repeticion no coinciden.')
      return
    }

    if (nextPassword === currentPassword.trim()) {
      setErrorMsg('La nueva contraseña debe ser distinta a la actual.')
      return
    }

    setIsChangingPassword(true)
    setErrorMsg(null)
    setSuccessMsg('Actualizando contraseña...')

    try {
      const currentEmail = normalizeEmail(user.email ?? accountEmail)
      if (!currentEmail) {
        setSuccessMsg(null)
        setErrorMsg('No se encontro un email principal para validar la contraseña actual.')
        setIsChangingPassword(false)
        return
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: currentPassword.trim(),
      })

      if (verifyError) {
        setSuccessMsg(null)
        setErrorMsg('La contraseña actual no es valida.')
        setIsChangingPassword(false)
        return
      }

      const { error } = await supabase.auth.updateUser({ password: nextPassword })

      if (error) {
        setSuccessMsg(null)
        setErrorMsg(error.message)
        setIsChangingPassword(false)
        return
      }

      setCurrentPassword('')
      setChangePassword('')
      setRepeatChangePassword('')
      setSuccessMsg('Contrasena actualizada correctamente.')
    } catch {
      setSuccessMsg(null)
      setErrorMsg('No se pudo actualizar la contraseña.')
    } finally {
      setIsChangingPassword(false)
    }
  }

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
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Panel de usuario</h1>
        <p className="mt-2 text-sm">
          Centraliza tus datos personales, seguridad y acciones sensibles desde un unico lugar.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="thsj-panel p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
            Datos de la cuenta
          </p>
          <h2 className="mt-2 text-xl font-bold text-foreground">Editar informacion personal</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-foreground">Nombre completo</span>
              <input
                className="thsj-input px-3 py-2.5"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Nombre y apellido"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">WhatsApp</span>
              <input
                className="thsj-input px-3 py-2.5"
                type="tel"
                value={whatsappNumber}
                onChange={(event) => setWhatsappNumber(event.target.value)}
                placeholder="5492645551234"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Domicilio</span>
              <input
                className="thsj-input px-3 py-2.5"
                value={domicile}
                onChange={(event) => setDomicile(event.target.value)}
                placeholder="Calle y numero"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-foreground">Email principal</span>
              <input
                className="thsj-input px-3 py-2.5"
                type="email"
                value={accountEmail}
                onChange={(event) => setAccountEmail(event.target.value)}
                placeholder="tu@email.com"
                required
              />
              <span className="text-xs text-(--foreground-muted)">
                Si lo cambiás, Supabase enviará una confirmación al nuevo correo.
              </span>
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-foreground">Email de recuperacion</span>
              <input
                className="thsj-input px-3 py-2.5"
                type="email"
                value={recoveryEmail}
                onChange={(event) => setRecoveryEmail(event.target.value)}
                placeholder="correo alternativo"
                required
              />
            </label>
          </div>
        </div>

        <div
          id="acceso"
          className={[
            'thsj-panel p-5 sm:p-6',
            activeSection === 'acceso' ? 'ring-2 ring-(--brand-secondary)' : '',
          ].join(' ')}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
            Seguridad
          </p>
          <h2 className="mt-2 text-xl font-bold text-foreground">Accesos y contraseña</h2>

          <div className="mt-5 grid gap-4">
            <div className="rounded-2xl border border-(--line) bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)">
                Correo actual
              </p>
              <p className="mt-2 break-all text-base font-semibold text-foreground">
                {profileLoading ? 'Cargando...' : (user?.email ?? 'Sin email')}
              </p>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Nueva contraseña</span>
              <input
                className="thsj-input px-3 py-2.5"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Dejar vacio para no cambiar"
                minLength={6}
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving || loading}
              className="thsj-btn thsj-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/reset-password')}
              className="thsj-btn thsj-btn-ghost w-full"
            >
              Recuperar contraseña
            </button>
          </div>

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
        </div>
      </div>

      <section
        id="cambiar-password"
        className={[
          'thsj-panel p-5 sm:p-6',
          activeSection === 'cambiar-password' ? 'ring-2 ring-(--brand-secondary)' : '',
        ].join(' ')}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
          Seguridad
        </p>
        <h2 className="mt-2 text-xl font-bold text-foreground">Cambiar contraseña</h2>
        <p className="mt-2 text-sm text-(--foreground-muted)">
          Ingresa tu contraseña actual y define una nueva contraseña segura.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Contraseña actual</span>
            <input
              className="thsj-input px-3 py-2.5"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Tu contraseña actual"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Nueva contraseña</span>
            <input
              className="thsj-input px-3 py-2.5"
              type="password"
              value={changePassword}
              onChange={(event) => setChangePassword(event.target.value)}
              placeholder="Nueva contraseña"
              minLength={6}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Repetir nueva contraseña</span>
            <input
              className="thsj-input px-3 py-2.5"
              type="password"
              value={repeatChangePassword}
              onChange={(event) => setRepeatChangePassword(event.target.value)}
              placeholder="Repeti la nueva contraseña"
              minLength={6}
              required
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={isChangingPassword || loading}
            className="thsj-btn thsj-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isChangingPassword ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
        </div>
      </section>

      <aside
        id="eliminar-cuenta"
        className={[
          'thsj-panel border border-[#f0b8b6] bg-[#fff7f6] p-5 sm:p-6',
          activeSection === 'eliminar-cuenta' ? 'ring-2 ring-(--danger)' : '',
        ].join(' ')}
      >
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

        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={isDeleting || confirmationText.trim() !== 'ELIMINAR'}
          className="thsj-btn thsj-btn-danger mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? 'Eliminando cuenta...' : 'Eliminar mi cuenta'}
        </button>
      </aside>
    </section>
  )
}
