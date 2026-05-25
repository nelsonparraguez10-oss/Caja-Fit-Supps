import { useState, useEffect } from 'react'
import { settingsDB, fetchUFValue } from '../data/settings'

export function useSettings() {
  const [cfg, setCfg] = useState(() => settingsDB.get())

  useEffect(() => {
    let cancelled = false

    async function init() {
      // 1. Cargar configuración desde Supabase
      const loadedCfg = await settingsDB.load()
      if (cancelled) return

      // 2. Obtener valor UF actualizado (caché 24 h o fetch remoto)
      const ufValue = await fetchUFValue()
      if (cancelled) return

      if (ufValue && Math.round(ufValue) !== loadedCfg.ufValue) {
        const updated = { ...loadedCfg, ufValue: Math.round(ufValue) }
        setCfg(updated)
        settingsDB.save(updated)
      } else {
        setCfg(loadedCfg)
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  const save = async (newCfg) => {
    setCfg(newCfg)
    await settingsDB.save(newCfg)
  }

  return { cfg, save }
}
