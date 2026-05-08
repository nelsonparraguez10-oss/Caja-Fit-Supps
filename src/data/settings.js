const KEY = 'pos_settings'

export const DEFAULT_SETTINGS = {
  getnet: {
    debito:  { rate: 0.70, fixed: 0 },   // rate en % (0.70 = 0.70%)
    credito: { rate: 1.50, fixed: 0 },
  },
  mercadopago: { rate: 5.99, fixed: 0 },
}

export const settingsDB = {
  get() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY))
      if (!raw) return structuredClone(DEFAULT_SETTINGS)
      return {
        getnet: {
          debito:  { ...DEFAULT_SETTINGS.getnet.debito,  ...raw.getnet?.debito  },
          credito: { ...DEFAULT_SETTINGS.getnet.credito, ...raw.getnet?.credito },
        },
        mercadopago: { ...DEFAULT_SETTINGS.mercadopago, ...raw.mercadopago },
      }
    } catch { return structuredClone(DEFAULT_SETTINGS) }
  },
  save(data) {
    localStorage.setItem(KEY, JSON.stringify(data))
  },
}