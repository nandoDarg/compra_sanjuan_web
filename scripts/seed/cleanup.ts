import type { SupabaseClient } from '@supabase/supabase-js'
import { SEED_CONFIG } from './config'

async function listSeedUsers(supabase: SupabaseClient) {
  const seedUsers: Array<{ id: string; email: string }> = []
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw new Error(`No se pudo listar usuarios de Auth: ${error.message}`)
    }

    const users = data.users ?? []
    for (const user of users) {
      if (user.email?.toLowerCase().endsWith(`@${SEED_CONFIG.emailDomain}`)) {
        seedUsers.push({ id: user.id, email: user.email })
      }
    }

    if (users.length < perPage) {
      break
    }

    page += 1
  }

  return seedUsers
}

async function removeUserStorageObjects(supabase: SupabaseClient, userId: string) {
  const { data: files, error: listError } = await supabase.storage
    .from(SEED_CONFIG.storageBucket)
    .list(userId, { limit: 1000 })

  if (listError || !files || files.length === 0) {
    return
  }

  const paths = files.map((file) => `${userId}/${file.name}`)
  const { error: removeError } = await supabase.storage.from(SEED_CONFIG.storageBucket).remove(paths)

  if (removeError) {
    console.warn(`[cleanup] No se pudieron borrar objetos de Storage de ${userId}: ${removeError.message}`)
  }
}

/**
 * Borra todos los usuarios de seed (identificados por el dominio de email
 * SEED_EMAIL_DOMAIN) junto con sus objetos de Storage. Los posts/post_images/
 * vehicle_details/profile se limpian solos via ON DELETE CASCADE al borrar
 * el usuario de auth.users. No toca ningun usuario real.
 */
export async function cleanupSeedData(supabase: SupabaseClient): Promise<number> {
  const seedUsers = await listSeedUsers(supabase)
  console.log(`[cleanup] Usuarios de seed encontrados: ${seedUsers.length}`)

  let deleted = 0
  for (const user of seedUsers) {
    await removeUserStorageObjects(supabase, user.id)

    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) {
      console.warn(`[cleanup] No se pudo borrar ${user.email}: ${error.message}`)
      continue
    }

    deleted += 1
    console.log(`[cleanup] ${deleted}/${seedUsers.length} - ${user.email}`)
  }

  return deleted
}
