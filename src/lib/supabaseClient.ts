import { createClient } from '@supabase/supabase-js'

// Public values — safe to expose in the frontend.
const SUPABASE_URL = 'https://fytksuhwheohqcobuzbk.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_6S1XcrawI4mYXc1yKVG1Bw_qf_eZUrI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
