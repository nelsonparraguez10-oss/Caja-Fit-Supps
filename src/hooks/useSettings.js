import { useState, useEffect } from 'react'
import { settingsDB } from '../data/settings'

export function useSettings() {
  const [cfg, setCfg] = useState(() => settingsDB.get())

  // Sincroniza desde Supabase al montar (sobrescribe el caché local si hay datos en la nube)
  useEffect(() => {
    settingsDB.load().then(setCfg)
  }, [])

  const save = async (newCfg) => {
    setCfg(newCfg)
    await settingsDB.save(newCfg)
  }

  return { cfg, save }
}
