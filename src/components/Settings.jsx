import { useState } from 'react'
import { DEFAULT_SETTINGS } from '../data/settings'
import { formatCLP }        from '../utils/calculations'

const PREVIEW_AMOUNT = 50000

function commissionOf(total, rate, fixed) {
  return Math.round(total * (rate / 100) + fixed)
}

function RateRow({ label, value, onChange }) {
  return (
    <div className="cfg-rate-row">
      <span className="cfg-rate-label">{label}</span>
      <div className="cfg-rate-fields">
        <div className="cfg-rate-field">
          <label className="cfg-field-label">Tasa %</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={value.rate}
            onChange={(e) => onChange({ ...value, rate: parseFloat(e.target.value) || 0 })}
            className="cfg-input"
          />
        </div>
        <div className="cfg-rate-field">
          <label className="cfg-field-label">Fee fijo $</label>
          <input
            type="number"
            min="0"
            step="1"
            value={value.fixed}
            onChange={(e) => onChange({ ...value, fixed: parseFloat(e.target.value) || 0 })}
            className="cfg-input"
          />
        </div>
        <div className="cfg-rate-preview">
          <span className="cfg-preview-label">En {formatCLP(PREVIEW_AMOUNT)}:</span>
          <span className="cfg-preview-value">{formatCLP(commissionOf(PREVIEW_AMOUNT, value.rate, value.fixed))}</span>
        </div>
      </div>
    </div>
  )
}

export function Settings({ cfg, onSave }) {
  const [draft, setDraft] = useState(() => structuredClone(cfg))
  const [saved, setSaved] = useState(false)

  const update = (path, value) => {
    setDraft((prev) => {
      const next = structuredClone(prev)
      const keys = path.split('.')
      let cur = next
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]]
      cur[keys[keys.length - 1]] = value
      return next
    })
    setSaved(false)
  }

  const handleSave = () => {
    onSave(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    const d = structuredClone(DEFAULT_SETTINGS)
    setDraft(d)
    setSaved(false)
  }

  return (
    <div className="cfg-module">
      <div className="module-header">
        <div>
          <h2>Configuración de Cobros POS</h2>
          <p className="module-sub">Tasas de comisión por agente de pago</p>
        </div>
      </div>

      {/* GETNET */}
      <div className="cfg-card">
        <div className="cfg-card__header">
          <h3 className="cfg-card__title">Punto de Venta</h3>
          <p className="cfg-card__sub">Aplica sobre el total de la venta en cobros con tarjeta física</p>
        </div>
        <RateRow
          label="Tarjeta de Débito"
          value={draft.getnet.debito}
          onChange={(v) => update('getnet.debito', v)}
        />
        <RateRow
          label="Tarjeta de Crédito"
          value={draft.getnet.credito}
          onChange={(v) => update('getnet.credito', v)}
        />
      </div>

      {/* Mercado Pago */}
      <div className="cfg-card">
        <div className="cfg-card__header">
          <h3 className="cfg-card__title">E-Commerce</h3>
          <p className="cfg-card__sub">Comisión descontada automáticamente por la plataforma</p>
        </div>
        <RateRow
          label="Comisión MP"
          value={draft.mercadopago}
          onChange={(v) => update('mercadopago', v)}
        />
      </div>

      <div className="cfg-actions">
        <button type="submit" onClick={handleSave}>
          {saved ? 'GUARDADO ✓' : 'GUARDAR CAMBIOS'}
        </button>
        <button type="button" onClick={handleReset}>
          RESTAURAR VALORES PREDETERMINADOS
        </button>
      </div>
    </div>
  )
}