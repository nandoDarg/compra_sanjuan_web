import './loadEnv'

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function envFloat(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback
}

function envString(name: string, fallback: string): string {
  const raw = process.env[name]
  return raw && raw.trim().length > 0 ? raw.trim() : fallback
}

/** Tope duro pedido: nunca generar mas de 1000 publicaciones en una corrida. */
const HARD_POSTS_CAP = 1000

export const SEED_CONFIG = {
  usersCount: envInt('SEED_USERS_COUNT', 80),
  postsTotal: Math.min(envInt('SEED_POSTS_TOTAL', 1000), HARD_POSTS_CAP),
  minPostsPerUser: envInt('SEED_MIN_POSTS_PER_USER', 10),
  maxPostsPerUser: envInt('SEED_MAX_POSTS_PER_USER', 80),
  minImagesPerPost: envInt('SEED_MIN_IMAGES', 1),
  maxImagesPerPost: envInt('SEED_MAX_IMAGES', 5),
  typoRate: envFloat('SEED_TYPO_RATE', 0.1),
  abbreviationRate: envFloat('SEED_ABBREVIATION_RATE', 0.15),
  synonymRate: envFloat('SEED_SYNONYM_RATE', 0.4),
  userPassword: envString('SEED_USER_PASSWORD', 'Prueba123!'),
  emailDomain: envString('SEED_EMAIL_DOMAIN', 'seed.tratohechosj.test'),
  storageBucket: 'post-images',
  unsplashAccessKey: envString('UNSPLASH_ACCESS_KEY', ''),
} as const

export const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
