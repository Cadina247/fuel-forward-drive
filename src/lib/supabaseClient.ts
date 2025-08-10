import { createClient } from '@supabase/supabase-js'

// TODO: Replace with your Supabase project details (public values)
// Since env vars are not used here, it's okay to keep the anon key in frontend (it's public).
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co"
const SUPABASE_ANON_KEY = "YOUR-PUBLIC-ANON-KEY"

if (SUPABASE_URL.includes("YOUR-PROJECT") || SUPABASE_ANON_KEY.includes("YOUR-PUBLIC-ANON-KEY")) {
  // eslint-disable-next-line no-console
  console.warn("Supabase client not configured. Update SUPABASE_URL and SUPABASE_ANON_KEY in src/lib/supabaseClient.ts")
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
