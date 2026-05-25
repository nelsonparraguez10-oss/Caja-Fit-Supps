import { supabase, getStoreId } from '../lib/supabase'

const LS_KEY    = 'pos_settings'
const UF_LS_KEY = 'pos_uf_cache'

// Devuelve { valor, fecha } del caché si existe y es de hoy
export function getUFCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(UF_LS_KEY))
    if (cached?.valor && cached?.fecha) return cached
  } catch { /* ignore */ }
  return null
}

// Busca el valor UF desde mindicador.cl; cachea por 24 h en localStorage
export async function fetchUFValue() {
  const cached = getUFCache()
  if (cached) {
    const ageMs = Date.now() - new Date(cached.fecha).getTime()
    if (ageMs < 24 * 60 * 60 * 1000) return cached.valor
  }
  try {
    const res  = await fetch('https://mindicador.cl/api/uf')
    const data = await res.json()
    const valor = data?.serie?.[0]?.valor
    if (valor) {
      localStorage.setItem(UF_LS_KEY, JSON.stringify({ valor, fecha: new Date().toISOString() }))
      return valor
    }
  } catch { /* sin conexión, devuelve caché vencido o null */ }
  return cached?.valor ?? null
}

export const DEFAULT_SETTINGS = {
  posType: 'getnet',
  ufValue: 38500,

  getnet: {
    debito: {
      visa:       { rate: 0.65, fixedUF: 0.0020 },
      mastercard: { rate: 2.65, fixedUF: 0.0122 },
    },
    credito: {
      visa:       { rate: 1.65, fixedUF: 0.0023 },
      mastercard: { rate: 1.65, fixedUF: 0.0023 },
    },
    extranjero: {
      visa:       { rate: 2.65, fixedUF: 0.0122 },
      mastercard: { rate: 2.65, fixedUF: 0.0122 },
    },
    prepago: {
      visa:       { rate: 1.09, fixedUF: 0.0019 },
      mastercard: { rate: 1.09, fixedUF: 0.0019 },
    },
  },

  tuu: {
    debito:  { rate: 1.49, fixed: 0 },
    credito: { rate: 1.99, fixed: 0 },
  },

  mercadopago: { rate: 5.99, fixed: 0 },
}

function mergeBrand(saved, def) {
  if (!saved) return { ...def }
  return { rate: saved.rate ?? def.rate, fixedUF: saved.fixedUF ?? def.fixedUF }
}

function mergeGetnetType(saved, def) {
  // Backwards compat: old flat structure { rate, fixed } → new { visa, mastercard }
  if (saved && typeof saved.rate === 'number') {
    return {
      visa:       { rate: saved.rate, fixedUF: 0 },
      mastercard: { rate: saved.rate, fixedUF: 0 },
    }
  }
  return {
    visa:       mergeBrand(saved?.visa,       def.visa),
    mastercard: mergeBrand(saved?.mastercard, def.mastercard),
  }
}

function mergeWithDefaults(raw) {
  if (!raw) return structuredClone(DEFAULT_SETTINGS)
  return {
    posType: raw.posType ?? DEFAULT_SETTINGS.posType,
    ufValue: raw.ufValue ?? DEFAULT_SETTINGS.ufValue,
    getnet: {
      debito:     mergeGetnetType(raw.getnet?.debito,     DEFAULT_SETTINGS.getnet.debito),
      credito:    mergeGetnetType(raw.getnet?.credito,    DEFAULT_SETTINGS.getnet.credito),
      extranjero: mergeGetnetType(raw.getnet?.extranjero, DEFAULT_SETTINGS.getnet.extranjero),
      prepago:    mergeGetnetType(raw.getnet?.prepago,    DEFAULT_SETTINGS.getnet.prepago),
    },
    tuu: {
      debito:  { ...DEFAULT_SETTINGS.tuu.debito,  ...raw.tuu?.debito  },
      credito: { ...DEFAULT_SETTINGS.tuu.credito, ...raw.tuu?.credito },
    },
    mercadopago: { ...DEFAULT_SETTINGS.mercadopago, ...raw.mercadopago },
  }
}

export const settingsDB = {
  get() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY))
      return mergeWithDefaults(raw)
    } catch { return structuredClone(DEFAULT_SETTINGS) }
  },

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

  async save(data) {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
    const storeId = getStoreId()
    if (!storeId) return
    await supabase
      .from('store_settings')
      .upsert({ store_id: storeId, settings: data }, { onConflict: 'store_id' })
  },
}
