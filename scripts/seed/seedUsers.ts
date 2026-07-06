import { randomInt } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SEED_CONFIG } from './config'
import { SAN_JUAN_DEPARTMENTS } from '../../src/lib/san-juan-departments'
import { stripDiacritics } from './textUtils'

const FIRST_NAMES = [
  'Juan', 'Maria', 'Lucas', 'Sofia', 'Martin', 'Lucia', 'Agustin', 'Valentina',
  'Franco', 'Camila', 'Nicolas', 'Micaela', 'Diego', 'Florencia', 'Matias',
  'Julieta', 'Gonzalo', 'Antonella', 'Federico', 'Rocio', 'Ezequiel', 'Ayelen',
  'Ignacio', 'Milagros', 'Santiago', 'Daniela', 'Bruno', 'Carla', 'Emanuel',
  'Paula', 'Rodrigo', 'Victoria', 'Marcos', 'Belen', 'Cristian', 'Noelia',
]

const LAST_NAMES = [
  'Perez', 'Gomez', 'Sosa', 'Torres', 'Quiroga', 'Paredes', 'Sarmiento',
  'Arce', 'Mena', 'Ortiz', 'Funes', 'Fernandez', 'Diaz', 'Molina', 'Rojas',
  'Godoy', 'Videla', 'Aguero', 'Castro', 'Nieva', 'Vega', 'Ibañez', 'Correa',
  'Moreno', 'Acosta', 'Lucero', 'Herrera', 'Juarez', 'Suarez', 'Ramos',
]

export type SeedUser = {
  id: string
  email: string
  fullName: string
  whatsappNumber: string
}

function randomFrom<T>(values: readonly T[]): T {
  return values[randomInt(0, values.length)]
}

function slugifyNamePart(value: string) {
  return stripDiacritics(value.toLowerCase())
}

function buildFictionalIdentities(count: number) {
  const identities: Array<{ fullName: string; email: string; whatsappNumber: string }> = []
  const usedEmails = new Set<string>()

  let attempt = 0
  while (identities.length < count && attempt < count * 20) {
    attempt += 1
    const firstName = randomFrom(FIRST_NAMES)
    const lastName = randomFrom(LAST_NAMES)
    const fullName = `${firstName} ${lastName}`
    const baseEmail = `${slugifyNamePart(firstName)}.${slugifyNamePart(lastName)}`
    const email = `${baseEmail}${identities.length}@${SEED_CONFIG.emailDomain}`

    if (usedEmails.has(email)) {
      continue
    }

    usedEmails.add(email)
    identities.push({
      fullName,
      email,
      whatsappNumber: `264510${String(1000 + identities.length).padStart(4, '0')}`,
    })
  }

  return identities
}

async function listAllAuthUsers(supabase: SupabaseClient) {
  const allUsers: Array<{ id: string; email?: string | null }> = []
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw new Error(`No se pudo listar usuarios de Auth: ${error.message}`)
    }

    const users = data.users ?? []
    allUsers.push(...users)

    if (users.length < perPage) {
      break
    }

    page += 1
  }

  return allUsers
}

/**
 * Crea (o reutiliza si ya existen por email) los usuarios ficticios de seed
 * y su fila de profiles. El trigger handle_new_user_profile solo setea
 * display_name; full_name/whatsapp_number/domicile/recovery_email son
 * NOT NULL desde 20260616_profiles_user_account_fields.sql y el trigger
 * nunca fue actualizado para llenarlos, asi que se hace un upsert explicito
 * aca (con service role, bypassa RLS) para dejar el perfil consistente,
 * igual que hace el flujo real de registro desde el cliente.
 */
export async function ensureSeedUsers(supabase: SupabaseClient): Promise<SeedUser[]> {
  const identities = buildFictionalIdentities(SEED_CONFIG.usersCount)
  const existingUsers = await listAllAuthUsers(supabase)
  const seedUsers: SeedUser[] = []

  for (const identity of identities) {
    const existing = existingUsers.find(
      (candidate) => candidate.email?.toLowerCase() === identity.email.toLowerCase()
    )

    let userId = existing?.id

    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: identity.email,
        password: SEED_CONFIG.userPassword,
        email_confirm: true,
        user_metadata: {
          full_name: identity.fullName,
          display_name: identity.fullName,
          source: 'seed-script',
        },
      })

      if (error || !data.user) {
        throw new Error(`No se pudo crear el usuario ${identity.email}: ${error?.message ?? 'error desconocido'}`)
      }

      userId = data.user.id
    }

    const locality = randomFrom(SAN_JUAN_DEPARTMENTS)
    const createdAtDaysAgo = randomInt(0, 365)
    const profileCreatedAt = new Date(Date.now() - createdAtDaysAgo * 24 * 60 * 60 * 1000).toISOString()

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: userId,
          display_name: identity.fullName,
          full_name: identity.fullName,
          whatsapp_number: identity.whatsappNumber,
          domicile: `Calle ${randomInt(100, 4000)}, ${locality}`,
          recovery_email: identity.email,
          email: identity.email,
          first_name: identity.fullName.split(' ')[0],
          last_name: identity.fullName.split(' ').slice(1).join(' ') || identity.fullName,
          locality,
          address_street: `Calle ${randomInt(100, 4000)}`,
          show_phone: true,
          created_at: profileCreatedAt,
        },
        { onConflict: 'user_id' }
      )

    if (profileError) {
      throw new Error(`No se pudo crear/actualizar el perfil de ${identity.email}: ${profileError.message}`)
    }

    seedUsers.push({
      id: userId,
      email: identity.email,
      fullName: identity.fullName,
      whatsappNumber: identity.whatsappNumber,
    })
  }

  return seedUsers
}
