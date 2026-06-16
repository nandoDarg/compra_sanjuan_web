import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Client with implicit flow for password recovery.
// resetPasswordForEmail called from a PKCE client generates a pkce_ prefixed
// token_hash that can only be verified if the original code verifier is present
// in the same browser/device. Using implicit flow avoids that entirely.
export const createRecoveryClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: 'implicit' } }
  )
