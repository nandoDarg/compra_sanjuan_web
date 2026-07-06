import path from 'node:path'
import { getAdminClient } from './adminClient'
import { SEED_CONFIG } from './config'
import { ensureSeedUsers } from './seedUsers'
import { ensurePlaceholderImages } from './seedImages'
import { seedPosts } from './seedPosts'
import { cleanupSeedData } from './cleanup'

function assertNotProduction() {
  if (process.env.NODE_ENV === 'production') {
    console.error('[seed] Abortado: NODE_ENV=production. Este generador es exclusivo de desarrollo.')
    process.exit(1)
  }
}

async function runClean() {
  const supabase = getAdminClient()
  const deleted = await cleanupSeedData(supabase)
  console.log(`[seed] Limpieza terminada. Usuarios de seed eliminados: ${deleted}`)
}

async function runSeed() {
  const supabase = getAdminClient()

  console.log('[seed] Config:', SEED_CONFIG)
  console.log(
    SEED_CONFIG.unsplashAccessKey
      ? '[seed] Modo imagenes: fotos reales de Unsplash (con fallback a placeholder ante cualquier error).'
      : '[seed] Modo imagenes: placeholder local (agrega UNSPLASH_ACCESS_KEY a .env.local para fotos reales).'
  )

  console.log('[seed] Paso 1/3 - Generando imagenes placeholder locales (fallback)...')
  const publicDir = path.join(process.cwd(), 'public')
  const imagePool = await ensurePlaceholderImages(publicDir)

  console.log('[seed] Paso 2/3 - Creando usuarios y perfiles...')
  const users = await ensureSeedUsers(supabase)
  console.log(`[seed] Usuarios listos: ${users.length}`)

  console.log('[seed] Paso 3/3 - Generando publicaciones...')
  const totalPosts = await seedPosts(supabase, users, imagePool)

  console.log(`[seed] Listo. Usuarios: ${users.length} | Publicaciones: ${totalPosts}`)
}

async function main() {
  assertNotProduction()

  const args = process.argv.slice(2)
  const shouldClean = args.includes('--clean')

  if (shouldClean) {
    await runClean()
    return
  }

  await runSeed()
}

main().catch((error) => {
  console.error('[seed] Fallo la ejecucion:', error)
  process.exit(1)
})
