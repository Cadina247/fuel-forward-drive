import { createClient } from '@supabase/supabase-js'

// Publishable (anon) values — safe to expose in the frontend.
// Configured via env vars, with the shared backend as fallback.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://fytksuhwheohqcobuzbk.supabase.co'
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6S1XcrawI4mYXc1yKVG1Bw_qf_eZUrI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
