import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react'
import { formatCLP } from '../utils/calculations'

const InvoiceTemplate = lazy(() =>
  import('./InvoiceTemplate').then((m) => ({ default: m.InvoiceTemplate }))
)
const ActionBar = lazy(() =>
  import('./ActionBar').then((m) => ({ default: m.ActionBar }))
)

const calcTotals = (items) => {
  const total = items.reduce((a, i) => a + i.subtotal, 0)
  const neto  = Math.round(total / 1.19)
  return { neto, iva: total - neto, total }
}

const TIPO_LABELS  = { boleta: 'Boleta', factura: 'Factura' }
const PAGO_LABELS  = { contado: 'Contado', transferencia: 'Transferencia', credito30: 'Crédito 30 días', credito60: 'Crédito 60 días' }
const PAGO_OPTS    = Object.entries(PAGO_LABELS)
const NV           = (n) => `NV-${String(n).padStart(4, '0')}`
const FOLIO_FMT    = (tipo, n) => `${tipo === 'boleta' ? 'B' : 'F'}-${String(n).padStart(6, '0')}`

// Emisor fijo — editable si se desea en el futuro via settings
const EMISOR = {
  razonSocial: 'FIT SUPPS SpA',
  rut:         '00.000.000-0',
  giro:        'Comercio al por menor de artículos deportivos y suplementos',
  direccion:   'Ingresa tu dirección',
  comuna:      'Ingresa tu comuna',
}

/* ── Print overlay ─────────────────────────────────────────────────────────── */
function PrintView({ doc, onClose }) {
  return (
    <div className="print-overlay">
      <div className="no-print print-actions-bar">
        <button type="button" onClick={() => window.print()}>IMPRIMIR</button>
        <button type="button" onClick={onClose}>CERRAR</button>
      </div>
      <div className="print-doc">
        <div className="print-header">
          <div>
            <h1 className="print-title">{TIPO_LABELS[doc.tipoDocumento].toUpperCase()}</h1>
            <p className="print-emisor">{EMISOR.razonSocial}</p>
            <p>RUT: {EMISOR.rut}</p>
            <p>Giro: {EMISOR.giro}</p>
            <p>{EMISOR.direccion}, {EMISOR.comuna}</p>
          </div>
          <div className="print-folio-box">
            <p className="print-folio-label">N°</p>
            <p className="print-folio-num">{FOLIO_FMT(doc.tipoDocumento, doc.folio)}</p>
            <p className="print-date">Fecha: {doc.fechaEmision}</p>
          </div>
        </div>

        {doc.receptor && (
          <div className="print-receptor">
            <h3>RECEPTOR</h3>
            <table className="print-receptor-table">
              <tbody>
                <tr><td>Razón Social</td><td>{doc.receptor.razonSocial}</td></tr>
                <tr><td>RUT</td><td>{doc.receptor.rut}</td></tr>
                {doc.receptor.giro && <tr><td>Giro</td><td>{doc.receptor.giro}</td></tr>}
                {doc.receptor.direccion && <tr><td>Dirección</td><td>{doc.receptor.direccion}{doc.receptor.comuna ? ', ' + doc.receptor.comuna : ''}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        <table className="print-items">
          <thead>
            <tr><th>Item</th><th>Cant.</th><th>P. Unitario</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            {doc.items.map((i, idx) => (
              <tr key={idx}>
                <td>{i.nombre}</td>
                <td>{i.cantidad}</td>
                <td>{formatCLP(i.precioUnitario)}</td>
                <td>{formatCLP(i.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-totals">
          <div className="print-total-row"><span>Neto</span><span>{formatCLP(doc.neto)}</span></div>
          <div className="print-total-row"><span>IVA 19%</span><span>{formatCLP(doc.iva)}</span></div>
          <div className="print-total-row print-total-row--grand"><span>TOTAL</span><span>{formatCLP(doc.total)}</span></div>
        </div>

        <div className="print-footer">
          <p><strong>Forma de pago:</strong> {PAGO_LABELS[doc.formaPago] || doc.formaPago}</p>
          {doc.referencias?.length > 0 && (
            <p><strong>Referencias:</strong> {doc.referencias.map((r) => `${r.tipo} ${r.folio}`).join(' · ')}</p>
          )}
          {doc.notaVentaId && <p className="text-muted" style={{fontSize:'11px', marginTop:'4px'}}>Originado desde {doc.notaVentaFolio ? NV(doc.notaVentaFolio) : 'Nota de Venta'}</p>}
        </div>
      </div>
    </div>
  )
}

/* ── Emission form ─────────────────────────────────────────────────────────── */
function EmitForm({ products, clients, prefillNote, onSubmit, onCancel }) {
  const [tipo, setTipo]           = useState('boleta')
  const [formaPago, setFormaPago] = useState('contado')
  const [receptor, setReceptor]   = useState(prefillNote?.cliente || null)
  const [cSearch, setCS]          = useState(prefillNote?.cliente?.razonSocial || '')
  const [showCSug, setShowCSug]   = useState(false)
  const [pSearch, setPS]          = useState('')
  const [showPSug, setShowPSug]   = useState(false)
  const [items, setItems]         = useState(prefillNote?.items || [])

  useEffect(() => {
    if (prefillNote) { setTipo('factura'); setReceptor(prefillNote.cliente || null); setCS(prefillNote.cliente?.razonSocial || ''); setItems(prefillNote.items) }
  }, [prefillNote])

  const cSug = useMemo(() => {
    if (!cSearch || receptor) return []
    const q = cSearch.toLowerCase()
    return clients.filter((c) => c.razonSocial.toLowerCase().includes(q) || c.rut.includes(q)).slice(0, 5)
  }, [clients, cSearch, receptor])

  const pSug = useMemo(() => {
    if (!pSearch) return []
    const q = pSearch.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q) || (p.marca || '').toLowerCase().includes(q)).slice(0, 8)
  }, [products, pSearch])

  const addP = (p) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.barcode === p.barcode)
      if (ex) return prev.map((i) => i.barcode === p.barcode ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precioUnitario } : i)
      return [...prev, { barcode: p.barcode, nombre: `${p.name}${p.variante ? ' — ' + p.variante : ''}`, precioUnitario: p.price, cantidad: 1, subtotal: p.price }]
    })
    setPS(''); setShowPSug(false)
  }

  const updateQty = (bc, v) => {
    const n = Math.max(1, parseInt(v) || 1)
    setItems((prev) => prev.map((i) => i.barcode === bc ? { ...i, cantidad: n, subtotal: n * i.precioUnitario } : i))
  }

  const totals = useMemo(() => calcTotals(items), [items])

  const handleEmit = () => {
    if (!items.length) return
    const doc = {
      tipoDocumento: tipo,
      formaPago,
      receptor: tipo === 'factura' ? receptor : null,
      items,
      referencias: prefillNote ? [{ tipo: 'NotaVenta', folio: prefillNote.folio, fecha: prefillNote.date, razon: 'Pedido confirmado' }] : [],
      notaVentaId:    prefillNote?.id    || null,
      notaVentaFolio: prefillNote?.folio || null,
      ...totals,
    }
    onSubmit(doc)
  }

  return (
    <div className="emit-form">
      <div className="emit-form__row">
        <div>
          <p className="section-label">TIPO DOCUMENTO</p>
          <div className="toggle-group">
            {Object.entries(TIPO_LABELS).map(([k, v]) => (
              <button key={k} type="button" className={tipo === k ? 'active' : ''} onClick={() => setTipo(k)}>{v.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="section-label">FORMA DE PAGO</p>
          <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)} style={{ width: '200px' }}>
            {PAGO_OPTS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {tipo === 'factura' && (
        <div className="note-section">
          <p className="section-label">RECEPTOR (FACTURA)</p>
          <div className="search-suggest">
            <input type="text" placeholder="Buscar cliente…" value={cSearch}
              onChange={(e) => { setCS(e.target.value); setReceptor(null); setShowCSug(true) }}
              onFocus={() => setShowCSug(true)} onBlur={() => setTimeout(() => setShowCSug(false), 150)}
            />
            {showCSug && cSug.length > 0 && (
              <ul className="dropdown">
                {cSug.map((c) => (
                  <li key={c.id} onMouseDown={() => { setReceptor(c); setCS(c.razonSocial); setShowCSug(false) }}>
                    <strong>{c.razonSocial}</strong><span className="text-muted"> {c.rut}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {receptor && (
            <div className="client-card-mini">
              <strong>{receptor.razonSocial}</strong>
              <span className="text-muted">RUT {receptor.rut}</span>
              {receptor.giro && <span className="text-muted">{receptor.giro}</span>}
              <button type="button" onClick={() => { setReceptor(null); setCS('') }}>CAMBIAR</button>
            </div>
          )}
        </div>
      )}

      <div className="note-section">
        <p className="section-label">AGREGAR PRODUCTOS</p>
        <div className="search-suggest">
          <input type="text" placeholder="Buscar producto…" value={pSearch}
            onChange={(e) => { setPS(e.target.value); setShowPSug(true) }}
            onFocus={() => setShowPSug(true)} onBlur={() => setTimeout(() => setShowPSug(false), 150)}
          />
          {showPSug && pSug.length > 0 && (
            <ul className="dropdown">
              {pSug.map((p) => (
                <li key={p.barcode} onMouseDown={() => addP(p)}>
                  <span>{p.name}{p.variante ? ` — ${p.variante}` : ''}</span>
                  <span className="dropdown-meta">{p.marca} · {formatCLP(p.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="note-section">
          <div className="table-wrap">
            <table className="note-items">
              <thead><tr><th>Item</th><th>P. Unitario</th><th>Cantidad</th><th>Subtotal</th><th></th></tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.barcode}>
                    <td>{i.nombre}</td>
                    <td>{formatCLP(i.precioUnitario)}</td>
                    <td><input type="number" min="1" value={i.cantidad} className="qty-input" onChange={(e) => updateQty(i.barcode, e.target.value)} /></td>
                    <td>{formatCLP(i.subtotal)}</td>
                    <td><button type="button" onClick={() => setItems((p) => p.filter((x) => x.barcode !== i.barcode))}>QUITAR</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="note-totals">
            <div className="total-row"><span>Neto</span><span>{formatCLP(totals.neto)}</span></div>
            <div className="total-row"><span>IVA 19%</span><span>{formatCLP(totals.iva)}</span></div>
            <div className="total-row total-row--grand"><span>TOTAL</span><span>{formatCLP(totals.total)}</span></div>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" onClick={handleEmit} disabled={!items.length || (tipo === 'factura' && !receptor)}>
          EMITIR {tipo === 'boleta' ? 'BOLETA' : 'FACTURA'}
        </button>
        <button type="button" onClick={onCancel}>CANCELAR</button>
      </div>
    </div>
  )
}

/* ── Invoice main ─────────────────────────────────────────────────────────── */
export function Invoice({ products, clients, notes, docs, onCreate, onRemove, onUpdateNote, prefillNote, onClearPrefill }) {
  const [mode, setMode]       = useState(prefillNote ? 'emit' : 'list')
  const [printId, setPrintId] = useState(null)
  const [filter, setFilter]   = useState('todos')
  const templateRef           = useRef(null)

  const printDoc = printId ? (docs.find((d) => d.id === printId) ?? null) : null

  useEffect(() => { if (prefillNote) setMode('emit') }, [prefillNote])

  const handleSubmit = (docData) => {
    const doc = onCreate(docData)
    if (docData.notaVentaId) onUpdateNote(docData.notaVentaId, { estado: 'facturada' })
    if (onClearPrefill) onClearPrefill()
    setPrintId(doc.id)
    setMode('list')
  }

  const handleCancel = () => { if (onClearPrefill) onClearPrefill(); setMode('list') }

  const filtered = useMemo(() => {
    if (filter === 'todos') return docs
    return docs.filter((d) => d.tipoDocumento === filter)
  }, [docs, filter])

  if (printDoc) return (
    <Suspense fallback={<div className="invoice"><p className="empty-msg">Cargando documento…</p></div>}>
      <div className="doc-screen-wrap">
        <ActionBar
          printRef={templateRef}
          tipo={printDoc.tipoDocumento}
          folio={FOLIO_FMT(printDoc.tipoDocumento, printDoc.folio)}
          receptor={printDoc.receptor}
          total={printDoc.total}
          onClose={() => setPrintId(null)}
        />
        <div className="doc-page-wrap">
          <InvoiceTemplate ref={templateRef} doc={printDoc} />
        </div>
      </div>
    </Suspense>
  )

  if (mode === 'emit') return (
    <div className="invoice">
      <div className="module-header">
        <div>
          <h2>{prefillNote ? `Emitir desde ${NV(prefillNote.folio)}` : 'Emitir Documento'}</h2>
          {prefillNote?.cliente && <p className="module-sub">{prefillNote.cliente.razonSocial} · {prefillNote.cliente.rut}</p>}
        </div>
        <button type="button" onClick={handleCancel}>VOLVER</button>
      </div>
      <EmitForm products={products} clients={clients} prefillNote={prefillNote || null} onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  )

  /* list */
  return (
    <div className="invoice">
      <div className="module-header">
        <div>
          <h2>Documentos Emitidos</h2>
          <p className="module-sub">{docs.length} documento(s) emitido(s)</p>
        </div>
        <button type="button" onClick={() => setMode('emit')}>EMITIR DOCUMENTO</button>
      </div>

      <div className="doc-filter">
        {['todos', 'boleta', 'factura'].map((f) => (
          <button key={f} type="button" className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="empty-msg">Sin documentos en esta categoría.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Folio</th><th>Tipo</th><th>Fecha</th><th>Receptor</th><th>Pago</th><th>Neto</th><th>IVA</th><th>Total</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map((d) => (
                <tr key={d.id}>
                  <td className="td-code">{FOLIO_FMT(d.tipoDocumento, d.folio)}</td>
                  <td><span className={`doc-badge doc-badge--${d.tipoDocumento}`}>{TIPO_LABELS[d.tipoDocumento]}</span></td>
                  <td>{d.fechaEmision}</td>
                  <td>{d.receptor?.razonSocial || <span className="text-muted">Consumidor Final</span>}</td>
                  <td className="text-muted">{PAGO_LABELS[d.formaPago] || d.formaPago}</td>
                  <td>{formatCLP(d.neto)}</td>
                  <td>{formatCLP(d.iva)}</td>
                  <td><strong>{formatCLP(d.total)}</strong></td>
                  <td>
                    <button type="button" onClick={() => setPrintId(d.id)}>VER</button>
                    <button type="button" className="btn-danger" onClick={() => onRemove(d.id)}>ELIMINAR</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
