import 'server-only'

// CRITICAL: This file must NEVER be imported in client components.
// Service role key BYPASSES all RLS policies.
if (typeof window !== 'undefined') {
  throw new Error(
    '[SECURITY] Supabase admin client cannot be used client-side. Move this logic to an API route.'
  )
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!serviceRoleKey) {
  throw new Error(
    '[SECURITY] SUPABASE_SERVICE_ROLE_KEY is required for admin operations. Add it to .env.local and Vercel environment variables.'
  )
}

/**
 * Client Supabase ADMIN (service-role, bypass RLS) — serveur uniquement.
 * Usage: app/api/**, lib/db/**, server components.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

