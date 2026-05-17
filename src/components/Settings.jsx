import { useState } from 'react'
import { DEFAULT_SETTINGS } from '../data/settings'
import { formatCLP }        from '../utils/calculations'
import { supabase }         from '../lib/supabase'

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

async function syncLocalToSupabase() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sin sesión activa')

  const userId = session.user.id
  const token  = session.access_token
  const url    = import.meta.env.VITE_SUPABASE_URL
  const key    = import.meta.env.VITE_SUPABASE_ANON_KEY

  const tables = [
    { lsKey: 'pos_products',  table: 'products',  map: (p) => ({
        id: p.id, store_id: userId, barcode: p.barcode, name: p.name,
        variante: p.variante ?? null, marca: p.marca ?? null,
        proveedor: p.proveedor ?? null, category: p.category ?? null,
        price: p.price ?? 0, cost: p.cost ?? 0, stock: p.stock ?? 0,
        margen_pct: p.margenPct ?? null,
        created_at: p.createdAt ?? new Date().toISOString(),
      }) },
    { lsKey: 'pos_sales', table: 'sales', map: (s) => ({
        id: s.id, store_id: userId,
        date: s.date ?? new Date().toISOString(),
        channel: s.channel ?? 'POS', items: s.items ?? [],
        list_total: s.listTotal ?? s.total ?? 0,
        discount: s.discount ?? 0, discount_amount: s.discountAmount ?? 0,
        effective_total: s.effectiveTotal ?? s.total ?? 0,
        payment_method: s.paymentMethod ?? null, card_commission: s.cardCommission ?? 0,
        shipping: s.shipping ?? { cobro: 0, costo: 0, margin: 0 },
        status: s.status ?? 'COMPLETED', voided_at: s.voidedAt ?? null,
        created_at: s.date ?? new Date().toISOString(),
      }) },
  ]

  const results = []
  for (const { lsKey, table, map } of tables) {
    const raw = JSON.parse(localStorage.getItem(lsKey) || '[]')
    if (!raw.length) { results.push({ table, count: 0, error: null }); continue }
    const rows = raw.map(map)
    const CHUNK = 50
    let error = null
    for (let i = 0; i < rows.length; i += CHUNK) {
      const res = await fetch(`${url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          apikey: key, Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(rows.slice(i, i + CHUNK)),
      })
      if (!res.ok) { error = await res.json(); break }
    }
    results.push({ table, count: rows.length, error })
  }
  return results
}

export function Settings({ cfg, onSave }) {
  const [draft, setDraft] = useState(() => structuredClone(cfg))
  const [saved, setSaved] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null) // null | 'loading' | 'ok' | 'error'
  const [syncLog, setSyncLog]       = useState([])

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

  const handleSync = async () => {
    setSyncStatus('loading')
    setSyncLog([])
    try {
      const results = await syncLocalToSupabase()
      const hasError = results.some((r) => r.error)
      setSyncLog(results)
      setSyncStatus(hasError ? 'error' : 'ok')
    } catch (e) {
      setSyncLog([{ table: '—', count: 0, error: e.message }])
      setSyncStatus('error')
    }
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

      {/* Sincronización localStorage → Supabase */}
      <div className="cfg-card cfg-card--sync">
        <div className="cfg-card__header">
          <h3 className="cfg-card__title">Sincronizar datos locales</h3>
          <p className="cfg-card__sub">
            Si usaste el sistema sin conexión o en otro servidor, presiona este botón
            para subir el inventario y ventas guardados en este navegador a la nube.
          </p>
        </div>

        <button
          type="button"
          className={`btn-sync${syncStatus === 'loading' ? ' btn-sync--loading' : ''}`}
          onClick={handleSync}
          disabled={syncStatus === 'loading'}
        >
          {syncStatus === 'loading' ? 'SINCRONIZANDO…' : 'SINCRONIZAR DATOS LOCALES → NUBE'}
        </button>

        {syncLog.length > 0 && (
          <ul className="sync-log">
            {syncLog.map((r) => (
              <li key={r.table} className={`sync-log__item${r.error ? ' sync-log__item--err' : ' sync-log__item--ok'}`}>
                {r.error
                  ? `❌ ${r.table}: ${JSON.stringify(r.error)}`
                  : `✓ ${r.table}: ${r.count} registro(s) sincronizado(s)`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}