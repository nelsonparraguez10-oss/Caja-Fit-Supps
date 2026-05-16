import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

// store_id cacheado en módulo para que db.js lo lea sincrónicamente.
// Se actualiza cada vez que la sesión cambia (ver App.jsx).
let _storeId = null
export const setStoreId = (id) => { _storeId = id }
export const getStoreId = () => _storeId