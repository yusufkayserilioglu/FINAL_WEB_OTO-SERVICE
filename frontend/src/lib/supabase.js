import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Oturumun sayfa yenilendiğinde kaybolmaması için açıkça belirtildi
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: true,
    storage:            window.localStorage,
    storageKey:         'lions-mechanic-auth',
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})
