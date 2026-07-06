import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config'

let cachedClient: SupabaseClient | null = null

/**
 * Cliente admin con permisos totales (bypassa RLS), igual patron que
 * buildAdminClient() en src/app/api/account/delete/route.ts. Acepta tanto la
 * legacy Service Role Key (JWT) como la nueva Secret API Key de Supabase
 * (prefijo `sb_secret_...`) — ambas son intercambiables como segundo
 * argumento de createClient(). Solo debe usarse desde scripts de desarrollo,
 * nunca desde codigo de src/.
 */
export function getAdminClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Faltan SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL) y/o SUPABASE_SERVICE_ROLE_KEY. ' +
        'Agrega SUPABASE_SERVICE_ROLE_KEY a .env.local (Supabase Dashboard > Settings > API Keys > Secret keys).'
    )
  }

  cachedClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return cachedClient
}
