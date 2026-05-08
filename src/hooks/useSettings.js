import { useState } from 'react'
import { settingsDB } from '../data/settings'

export function useSettings() {
  const [cfg, setCfg] = useState(() => settingsDB.get())

  const save = (newCfg) => {
    settingsDB.save(newCfg)
    setCfg(newCfg)
  }

  return { cfg, save }
}