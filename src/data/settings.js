import { supabase, getStoreId } from '../lib/supabase'

const LS_KEY = 'pos_settings'

export const DEFAULT_SETTINGS = {
  getnet: {
    debito:  { rate: 0.70, fixed: 0 },
    credito: { rate: 1.50, fixed: 0 },
  },
  mercadopago: { rate: 5.99, fixed: 0 },
}

function mergeWithDefaults(raw) {
  if (!raw) return structuredClone(DEFAULT_SETTINGS)
  return {
    getnet: {
      debito:  { ...DEFAULT_SETTINGS.getnet.debito,  ...raw.getnet?.debito  },
      credito: { ...DEFAULT_SETTINGS.getnet.credito, ...raw.getnet?.credito },
    },
    mercadopago: { ...DEFAULT_SETTINGS.mercadopago, ...raw.mercadopago },
  }
}

export const settingsDB = {
  // Lee desde localStorage (sincrónico, para inicializar el estado de React)
  get() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY))
      return mergeWithDefaults(raw)
    } catch { return structuredClone(DEFAULT_SETTINGS) }
  },

  // Carga desde Supabase y actualiza localStorage como caché
  async load() {
    const storeId = getStoreId()
    if (!storeId) return this.get()
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('settings')
        .eq('store_id', storeId)
        .maybeSingle()
      if (data?.settings) {
        localStorage.setItem(LS_KEY, JSON.stringify(data.settings))
        return mergeWithDefaults(data.settings)
      }
    } catch { /* fallback a localStorage */ }
    return this.get()
  },

  // Guarda en Supabase y actualiza caché local
  async save(data) {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
    const storeId = getStoreId()
    if (!storeId) return
    await supabase
      .from('store_settings')
      .upsert({ store_id: storeId, settings: data }, { onConflict: 'store_id' })
  },
}
