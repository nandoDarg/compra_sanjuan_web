'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { SAN_JUAN_DEPARTMENTS, resolveSanJuanDepartment } from '@/lib/san-juan-departments'
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
  first_name: string | null
  last_name: string | null
  dni: string | null
  phone: string | null
  show_phone: boolean | null
  address_street: string | null
  locality: string | null
  email: string | null
  full_name: string | null
  whatsapp_number: string | null
  domicile: string | null
  recovery_email: string | null
}

type Msg = { type: 'success' | 'error'; text: string }

function clearLocalAccountState() {
  if (typeof window === 'undefined') return
  const keysToRemove: string[] = []
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (key?.startsWith('thsj:')) keysToRemove.push(key)
  }
  for (const key of keysToRemove) window.localStorage.removeItem(key)
}

function InlineMsg({ msg }: { msg: Msg | null }) {
  if (!msg) return null
  return (
    <p
      className={[
        'rounded-xl border px-4 py-2.5 text-sm',
        msg.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-(--success)'
          : 'border-red-200 bg-red-50 text-(--danger)',
      ].join(' ')}
    >
      {msg.text}
    </p>
  )
}

export default function ConfiguracionPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { user, loading } = useAuth()

  // Información personal
  const [displayName, setDisplayName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dni, setDni] = useState('')
  const [phone, setPhone] = useState('')
  const [showPhone, setShowPhone] = useState(true)
  const [addressStreet, setAddressStreet] = useState('')
  const [locality, setLocality] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<Msg | null>(null)

  // Acceso y contraseña
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<Msg | null>(null)

  // Eliminar cuenta
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState<Msg | null>(null)

  useEffect(() => {
    if (!user) return

    const loadProfile = async () => {
      setProfileLoading(true)

      const { data } = await supabase
        .from('profiles')
        .select(
          'display_name,first_name,last_name,dni,phone,show_phone,address_street,locality,email,full_name,whatsapp_number,domicile,recovery_email'
        )
        .eq('user_id', user.id)
        .maybeSingle<ProfileRow>()

      const snapshot = resolveProfileSnapshot({
        profile: data,
        metadata: (user.user_metadata ?? {}) as Record<string, unknown>,
        fallbackEmail: user.email,
      })

      setDisplayName(snapshot.displayName)
      setFirstName(snapshot.firstName)
      setLastName(snapshot.lastName)
      setDni(snapshot.dni)
      setPhone(snapshot.phone)
      setShowPhone(snapshot.showPhone)
      setAddressStreet(snapshot.addressStreet)
      setLocality(resolveSanJuanDepartment(snapshot.locality))
      setProfileLoading(false)
    }

    void loadProfile()
  }, [supabase, user])

  const handleSaveProfile = async () => {
    if (!user) return
    setProfileMsg(null)

    const normalizedDisplayName = normalizeText(displayName)
    const normalizedFirstName = normalizeText(firstName)
    const normalizedLastName = normalizeText(lastName)
    const normalizedDni = normalizeText(dni)
    const normalizedPhone = sanitizeWhatsAppNumber(phone)
    const normalizedAddressStreet = normalizeText(addressStreet)
    const normalizedLocality = resolveSanJuanDepartment(locality)
    const normalizedEmail = normalizeEmail(user.email ?? '')
    const normalizedFullName = normalizeText(`${normalizedFirstName} ${normalizedLastName}`)

    if (normalizedDisplayName.length < 3 || normalizedDisplayName.length > 40) {
      setProfileMsg({ type: 'error', text: 'El nombre visible debe tener entre 3 y 40 caracteres.' })
      return
    }

    if (!normalizedFirstName) {
      setProfileMsg({ type: 'error', text: 'Ingresa tu nombre.' })
      return
    }

    if (!normalizedLastName) {
      setProfileMsg({ type: 'error', text: 'Ingresa tu apellido.' })
      return
    }

    if (normalizedPhone.length > 0 && normalizedPhone.length < 8) {
      setProfileMsg({ type: 'error', text: 'Ingresa un teléfono válido (mínimo 8 dígitos).' })
      return
    }

    if (!normalizedAddressStreet) {
      setProfileMsg({ type: 'error', text: 'Ingresa la dirección.' })
      return
    }

    if (!normalizedLocality) {
      setProfileMsg({ type: 'error', text: 'Selecciona una localidad.' })
      return
    }

    if (!normalizedEmail) {
      setProfileMsg({ type: 'error', text: 'Ingresa un email de contacto válido.' })
      return
    }

    setIsSavingProfile(true)

    try {
      const profilePayload = buildProfilePayload(user.id, {
        displayName: normalizedDisplayName,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        dni: normalizedDni,
        phone: normalizedPhone,
        showPhone,
        addressStreet: normalizedAddressStreet,
        locality: normalizedLocality,
        email: normalizedEmail,
        fullName: normalizedFullName,
        whatsappNumber: normalizedPhone,
        domicile: normalizedAddressStreet,
      })

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'user_id' })

      if (profileError) {
        setProfileMsg({ type: 'error', text: profileError.message })
        return
      }

      const authData: Record<string, string> = {
        display_name: normalizedDisplayName,
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        dni: normalizedDni,
        phone: normalizedPhone,
        address_street: normalizedAddressStreet,
        locality: normalizedLocality,
        email: normalizedEmail,
        full_name: normalizedFullName,
        whatsapp_number: normalizedPhone,
        domicile: normalizedAddressStreet,
        show_phone: showPhone ? 'true' : 'false',
      }

      const { error: authError } = await supabase.auth.updateUser({ data: authData })
      if (authError) {
        setProfileMsg({ type: 'error', text: authError.message })
        return
      }

      setProfileMsg({ type: 'success', text: 'Cambios guardados correctamente.' })
    } catch {
      setProfileMsg({ type: 'error', text: 'No se pudieron guardar los cambios.' })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user) return
    setPasswordMsg(null)

    const current = currentPassword.trim()
    const next = newPassword.trim()
    const confirm = confirmPassword.trim()

    if (!current) { setPasswordMsg({ type: 'error', text: 'Ingresa tu contraseña actual.' }); return }
    if (next.length < 6) { setPasswordMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' }); return }
    if (next !== confirm) { setPasswordMsg({ type: 'error', text: 'La nueva contraseña y su confirmación no coinciden.' }); return }
    if (next === current) { setPasswordMsg({ type: 'error', text: 'La nueva contraseña debe ser distinta a la actual.' }); return }

    setIsChangingPassword(true)

    try {
      const email = normalizeEmail(user.email ?? '')
      if (!email) {
        setPasswordMsg({ type: 'error', text: 'No se encontró el email de la cuenta.' })
        return
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: current })
      if (verifyError) {
        setPasswordMsg({ type: 'error', text: 'La contraseña actual no es valida.' })
        return
      }

      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) {
        setPasswordMsg({ type: 'error', text: error.message })
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' })
    } catch {
      setPasswordMsg({ type: 'error', text: 'No se pudo actualizar la contraseña.' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    setDeleteMsg(null)
    setIsDeleting(true)

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirmation: 'ELIMINAR' }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null

      if (!response.ok) {
        setDeleteMsg({ type: 'error', text: payload?.error ?? 'Error al eliminar la cuenta.' })
        setIsDeleting(false)
        setShowDeleteConfirm(false)
        return
      }

      clearLocalAccountState()
      try {
        await supabase.auth.signOut()
      } finally {
        router.replace('/login?account_deleted=1')
      }
    } catch {
      setDeleteMsg({ type: 'error', text: 'Error al eliminar la cuenta.' })
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading || profileLoading) {
    return (
      <section className="flex w-full flex-1 flex-col gap-6 py-6 sm:py-8">
        <div className="thsj-panel p-5 sm:p-6">
          <div className="h-5 w-52 animate-pulse rounded-lg bg-(--background-muted)" />
          <div className="mt-3 h-8 w-72 animate-pulse rounded-lg bg-(--background-muted)" />
        </div>
      </section>
    )
  }

  if (!user) return null

  return (
    <section className="flex w-full flex-1 flex-col gap-6 py-6 sm:py-8">

      {/* Header */}
      <div className="thsj-panel p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
          Cuenta
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
          Configuración y seguridad
        </h1>
        <p className="mt-2 text-sm text-(--foreground-muted)">
          Administra tu información personal, acceso y preferencias de seguridad.
        </p>
      </div>

      {/* Información personal */}
      <div className="thsj-panel p-5 sm:p-6">
        <h2 className="text-lg font-bold text-foreground">Información personal</h2>
        <p className="mt-1 text-sm text-(--foreground-muted)">
          Completá tus datos de perfil para mejorar la confianza en tus publicaciones.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Nombre visible</span>
            <input
              className="thsj-input px-3 py-2.5"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Cómo querés que te vean"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Nombre</span>
            <input
              className="thsj-input px-3 py-2.5"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej: Juan"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Apellido</span>
            <input
              className="thsj-input px-3 py-2.5"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej: Pérez"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">DNI</span>
            <input
              className="thsj-input px-3 py-2.5"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ej: 30123456"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Teléfono</span>
            <input
              className="thsj-input px-3 py-2.5"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Solo números"
            />
          </label>

          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              className="h-4 w-4 rounded border-(--line)"
              type="checkbox"
              checked={showPhone}
              onChange={(event) => setShowPhone(event.target.checked)}
            />
            <span className="text-sm text-foreground">Mostrar teléfono en publicaciones</span>
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Dirección</span>
            <input
              className="thsj-input px-3 py-2.5"
              value={addressStreet}
              onChange={(e) => setAddressStreet(e.target.value)}
              placeholder="Calle y número"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Localidad</span>
            <select
              className="thsj-input px-3 py-2.5"
              value={locality}
              onChange={(event) => setLocality(event.target.value)}
            >
              <option value="" disabled>
                Selecciona una localidad
              </option>
              {SAN_JUAN_DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Email</span>
            <input
              className="thsj-input px-3 py-2.5"
              type="email"
              value={user.email ?? ''}
              readOnly
              aria-readonly="true"
            />
            <span className="text-xs text-(--foreground-muted)">Este email se define al crear la cuenta y no puede editarse.</span>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <InlineMsg msg={profileMsg} />
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="thsj-btn thsj-btn-primary ml-auto disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingProfile ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Acceso y contraseña (unificado) */}
      <div className="thsj-panel p-5 sm:p-6">
        <h2 className="text-lg font-bold text-foreground">Acceso y contraseña</h2>
        <p className="mt-1 text-sm text-(--foreground-muted)">Tu correo de acceso es de solo lectura.</p>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Correo de acceso</span>
          <input
            className="thsj-input px-3 py-2.5"
            type="email"
            value={user.email ?? ''}
            readOnly
            aria-readonly="true"
          />
        </label>

        <p className="mt-4 text-sm text-(--foreground-muted)">
          Para cambiar la contraseña, ingresá tu contraseña actual y definí una nueva.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Contraseña actual</span>
            <input
              className="thsj-input px-3 py-2.5"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Tu contraseña actual"
              autoComplete="current-password"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Nueva contraseña</span>
            <input
              className="thsj-input px-3 py-2.5"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              minLength={6}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Confirmar nueva contraseña</span>
            <input
              className="thsj-input px-3 py-2.5"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeti la nueva contraseña"
              autoComplete="new-password"
              minLength={6}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <InlineMsg msg={passwordMsg} />
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={isChangingPassword}
            className="thsj-btn thsj-btn-primary ml-auto disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isChangingPassword ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </div>
      </div>

      {/* Eliminar cuenta */}
      <aside className="thsj-panel border border-[#f0b8b6] bg-[#fff7f6] p-5 sm:p-6">
        <h2 className="text-lg font-bold text-foreground">Eliminar cuenta</h2>
        <p className="mt-2 text-sm text-(--foreground-muted)">
          Esta acción es irreversible. Se eliminará permanentemente tu perfil, publicaciones e imágenes alojadas en Storage.
        </p>

        <InlineMsg msg={deleteMsg} />

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="thsj-btn thsj-btn-danger mt-5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Eliminar mi cuenta
          </button>
        ) : (
          <div className="mt-5 rounded-2xl border border-[#f0b8b6] bg-white/80 p-4">
            <p className="text-sm font-semibold text-foreground">
              ¿Estás seguro? Esta acción no se puede deshacer.
            </p>
            <p className="mt-1 text-sm text-(--foreground-muted)">
              Se eliminarán todos tus datos, publicaciones e imágenes de forma permanente.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="thsj-btn thsj-btn-danger disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Eliminando...' : 'Si, eliminar'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="thsj-btn thsj-btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </aside>

    </section>
  )
}
