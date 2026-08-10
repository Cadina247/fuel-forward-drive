import { createClient } from '@supabase/supabase-js'

// Public values — safe to expose in the frontend.
const SUPABASE_URL = 'https://zcjhmnfmrfbczbwcevey.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable__41xRjaUghJlVDG0qDgL8g_ZdVpyoY6'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
