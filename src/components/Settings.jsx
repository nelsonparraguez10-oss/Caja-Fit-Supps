import { useState, useCallback } from 'react'
import { DEFAULT_SETTINGS, fetchUFValue, getUFCache } from '../data/settings'
import { formatCLP } from '../utils/calculations'

const PREVIEW_AMOUNT = 50000

const POS_TYPES = [
  { key: 'getnet',      label: 'Getnet'       },
  { key: 'tuu',         label: 'Tuu'          },
  { key: 'mercadopago', label: 'Mercado Pago' },
  { key: 'otro',        label: 'Otro'         },
]

const GETNET_PAYMENT_TYPES = [
  { key: 'debito',     label: 'Débito'     },
  { key: 'credito',    label: 'Crédito'    },
  { key: 'extranjero', label: 'Extranjero' },
  { key: 'prepago',    label: 'Prepago'    },
]

function commissionWithIva(total, rate, fixedUF, ufValue) {
  return Math.round((total * (rate / 100) + fixedUF * ufValue) * 1.19)
}

function commissionSimple(total, rate, fixed) {
  return Math.round(total * (rate / 100) + (fixed ?? 0))
}

function BrandRow({ brand, value, preview, onChange }) {
  return (
    <div className="cfg-brand-row">
      <span className="cfg-brand-label">{brand}</span>
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
            className="cfg-input cfg-input--sm"
          />
        </div>
        <div className="cfg-rate-field">
          <label className="cfg-field-label">Fee UF</label>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={value.fixedUF}
            onChange={(e) => onChange({ ...value, fixedUF: parseFloat(e.target.value) || 0 })}
            className="cfg-input cfg-input--sm"
          />
        </div>
        <div className="cfg-rate-preview">
          <span className="cfg-preview-label">En {formatCLP(PREVIEW_AMOUNT)} c/IVA:</span>
          <span className="cfg-preview-value">{formatCLP(preview)}</span>
        </div>
      </div>
    </div>
  )
}

function GetnetTypeSection({ label, value, ufValue, onChange }) {
  const previewVisa = commissionWithIva(PREVIEW_AMOUNT, value.visa.rate, value.visa.fixedUF, ufValue)
  const previewMC   = commissionWithIva(PREVIEW_AMOUNT, value.mastercard.rate, value.mastercard.fixedUF, ufValue)
  return (
    <div className="cfg-getnet-type">
      <p className="cfg-getnet-type-label">{label}</p>
      <BrandRow
        brand="Visa"
        value={value.visa}
        preview={previewVisa}
        onChange={(v) => onChange({ ...value, visa: v })}
      />
      <BrandRow
        brand="Mastercard"
        value={value.mastercard}
        preview={previewMC}
        onChange={(v) => onChange({ ...value, mastercard: v })}
      />
    </div>
  )
}

function RateRow({ label, value, onChange }) {
  const preview = commissionSimple(PREVIEW_AMOUNT, value.rate, value.fixed)
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
            value={value.fixed ?? 0}
            onChange={(e) => onChange({ ...value, fixed: parseFloat(e.target.value) || 0 })}
            className="cfg-input"
          />
        </div>
        <div className="cfg-rate-preview">
          <span className="cfg-preview-label">En {formatCLP(PREVIEW_AMOUNT)}:</span>
          <span className="cfg-preview-value">{formatCLP(preview)}</span>
        </div>
      </div>
    </div>
  )
}

function formatUFDate(isoStr) {
  if (!isoStr) return null
  const d = new Date(isoStr)
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function Settings({ cfg, onSave }) {
  const [draft, setDraft] = useState(() => structuredClone(cfg))
  const [saved, setSaved] = useState(false)
  const [ufFetching, setUfFetching] = useState(false)
  const [ufCacheFecha, setUfCacheFecha] = useState(() => getUFCache()?.fecha ?? null)

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

  const handleRefreshUF = useCallback(async () => {
    setUfFetching(true)
    localStorage.removeItem('pos_uf_cache')
    const valor = await fetchUFValue()
    if (valor) {
      setDraft((prev) => ({ ...prev, ufValue: Math.round(valor) }))
      setSaved(false)
      setUfCacheFecha(new Date().toISOString())
    }
    setUfFetching(false)
  }, [])

  const handleSave = () => {
    onSave(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    setDraft(structuredClone(DEFAULT_SETTINGS))
    setSaved(false)
  }

  const posType = draft.posType ?? 'getnet'

  return (
    <div className="cfg-module">
      <div className="module-header">
        <div>
          <h2>Configuración de Cobros POS</h2>
          <p className="module-sub">Tasas de comisión por agente de pago</p>
        </div>
      </div>

      {/* Tipo de Terminal POS */}
      <div className="cfg-card">
        <div className="cfg-card__header">
          <h3 className="cfg-card__title">Tipo de Terminal POS</h3>
          <p className="cfg-card__sub">Selecciona el proveedor que usas en tu punto de venta físico</p>
        </div>
        <div className="cfg-pos-selector">
          {POS_TYPES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => update('posType', key)}
              className={`cfg-pos-btn${posType === key ? ' cfg-pos-btn--active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Getnet */}
      {posType === 'getnet' && (
        <div className="cfg-card">
          <div className="cfg-card__header">
            <h3 className="cfg-card__title">Getnet — Tarifas POS</h3>
            <p className="cfg-card__sub">Tarifas aplicadas por Getnet sobre el total de venta, más IVA 19% sobre la comisión</p>
          </div>

          <div className="cfg-uf-row">
            <span className="cfg-rate-label">Valor UF del día</span>
            <div className="cfg-rate-field">
              <label className="cfg-field-label">$ CLP por UF</label>
              <input
                type="number"
                min="0"
                step="1"
                value={draft.ufValue ?? 38500}
                onChange={(e) => update('ufValue', parseFloat(e.target.value) || 0)}
                className="cfg-input"
              />
            </div>
            <button
              type="button"
              onClick={handleRefreshUF}
              disabled={ufFetching}
              className="cfg-uf-refresh"
              title="Obtener valor UF actual desde mindicador.cl"
            >
              {ufFetching ? '...' : 'Actualizar UF'}
            </button>
            {ufCacheFecha && (
              <span className="cfg-uf-date">
                Actualizado: {formatUFDate(ufCacheFecha)}
              </span>
            )}
          </div>

          {GETNET_PAYMENT_TYPES.map(({ key, label }) => (
            <GetnetTypeSection
              key={key}
              label={label}
              value={draft.getnet[key]}
              ufValue={draft.ufValue ?? 38500}
              onChange={(v) => update(`getnet.${key}`, v)}
            />
          ))}
        </div>
      )}

      {/* Tuu */}
      {posType === 'tuu' && (
        <div className="cfg-card">
          <div className="cfg-card__header">
            <h3 className="cfg-card__title">Tuu — Tarifas POS</h3>
            <p className="cfg-card__sub">Aplica sobre el total de la venta en cobros con tarjeta física</p>
          </div>
          <RateRow
            label="Débito"
            value={draft.tuu.debito}
            onChange={(v) => update('tuu.debito', v)}
          />
          <RateRow
            label="Crédito"
            value={draft.tuu.credito}
            onChange={(v) => update('tuu.credito', v)}
          />
        </div>
      )}

      {/* Mercado Pago — siempre visible (canal ECOM) */}
      <div className="cfg-card">
        <div className="cfg-card__header">
          <h3 className="cfg-card__title">Mercado Pago — E-Commerce</h3>
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
