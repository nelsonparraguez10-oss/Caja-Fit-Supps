import { useState, useMemo, useRef, lazy, Suspense } from 'react'
import { formatCLP } from '../utils/calculations'

const SalesNoteTemplate = lazy(() =>
  import('./SalesNoteTemplate').then((m) => ({ default: m.SalesNoteTemplate }))
)
const ActionBar = lazy(() =>
  import('./ActionBar').then((m) => ({ default: m.ActionBar }))
)

const calcTotals = (items) => {
  const total = items.reduce((a, i) => a + i.subtotal, 0)
  const neto  = Math.round(total / 1.19)
  const iva   = total - neto
  return { neto, iva, total }
}

const ESTADO_LABEL = { pendiente: 'Pendiente', facturada: 'Facturada', anulada: 'Anulada' }
const NV = (n) => `NV-${String(n).padStart(4, '0')}`

export function SalesNote({ products, clients, notes, onCreate, onUpdate, onRemove, onEmit }) {
  const [mode, setMode]             = useState('list')
  const [editNote, setEditNote]     = useState(null)
  const [viewNoteId, setViewNoteId] = useState(null)
  const [draftNote, setDraftNote]   = useState(null)
  const viewNote = viewNoteId ? (notes.find((n) => n.id === viewNoteId) ?? null) : draftNote
  const templateRef                 = useRef(null)
  const [clientSearch, setCS]       = useState('')
  const [selectedClient, setSC]     = useState(null)
  const [showCSuggest, setShowCSug] = useState(false)
  const [prodSearch, setPS]         = useState('')
  const [showPSuggest, setShowPSug] = useState(false)
  const [items, setItems]           = useState([])
  const [obs, setObs]               = useState('')

  /* ── autocomplete ── */
  const cSuggestions = useMemo(() => {
    if (!clientSearch || selectedClient) return []
    const q = clientSearch.toLowerCase()
    return clients.filter((c) =>
      c.razonSocial.toLowerCase().includes(q) || c.rut.includes(q)
    ).slice(0, 6)
  }, [clients, clientSearch, selectedClient])

  const pSuggestions = useMemo(() => {
    if (!prodSearch) return []
    const q = prodSearch.toLowerCase()
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) || p.barcode.includes(q) ||
      (p.marca || '').toLowerCase().includes(q)
    ).slice(0, 8)
  }, [products, prodSearch])

  /* ── item helpers ── */
  const addProduct = (p) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.barcode === p.barcode)
      if (ex) return prev.map((i) => i.barcode === p.barcode
        ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precioUnitario } : i)
      return [...prev, {
        barcode: p.barcode,
        nombre:  `${p.name}${p.variante ? ' — ' + p.variante : ''}`,
        precioUnitario: p.price,
        cantidad: 1,
        subtotal: p.price,
      }]
    })
    setPS(''); setShowPSug(false)
  }

  const updateQty = (barcode, val) => {
    const n = Math.max(1, parseInt(val) || 1)
    setItems((prev) => prev.map((i) => i.barcode === barcode
      ? { ...i, cantidad: n, subtotal: n * i.precioUnitario } : i))
  }

  const totals = useMemo(() => calcTotals(items), [items])

  /* ── form actions ── */
  const resetForm = () => {
    setMode('list'); setEditNote(null)
    setSC(null); setCS(''); setItems([]); setObs('')
  }

  const handleSave = () => {
    if (!items.length) return
    const data = {
      cliente: selectedClient
        ? { id: selectedClient.id, razonSocial: selectedClient.razonSocial, rut: selectedClient.rut, giro: selectedClient.giro || '', direccion: selectedClient.direccion || '', comuna: selectedClient.comuna || '' }
        : null,
      items, observaciones: obs, ...totals,
    }
    if (editNote) { onUpdate(editNote.id, data) } else { onCreate(data) }
    resetForm()
  }

  const startEdit = (n) => {
    setEditNote(n)
    const cl = n.cliente?.id ? clients.find((c) => c.id === n.cliente.id) : null
    setSC(cl || n.cliente || null)
    setCS(n.cliente?.razonSocial || '')
    setItems(n.items)
    setObs(n.observaciones || '')
    setMode('form')
  }

  /* ── draft preview (desde formulario, sin guardar) ── */
  const handleDraftPreview = () => {
    if (!items.length) return
    setViewNoteId(null)
    setDraftNote({
      folio:         editNote?.folio ?? 0,
      date:          new Date().toLocaleDateString('es-CL'),
      cliente:       selectedClient
        ? { razonSocial: selectedClient.razonSocial, rut: selectedClient.rut,
            giro: selectedClient.giro || '', direccion: selectedClient.direccion || '',
            comuna: selectedClient.comuna || '' }
        : null,
      items,
      observaciones: obs,
      ...totals,
    })
  }

  /* ── template view (lista o borrador) ── */
  if (viewNote) return (
    <Suspense fallback={<div className="sales-note"><p className="empty-msg">Cargando vista previa…</p></div>}>
      <div className="doc-screen-wrap">
        <ActionBar
          printRef={templateRef}
          tipo="nota"
          folio={viewNote.folio > 0 ? NV(viewNote.folio) : 'BORRADOR'}
          receptor={viewNote.cliente}
          total={viewNote.total}
          onClose={() => { setViewNoteId(null); setDraftNote(null) }}
        />
        <div className="doc-page-wrap">
          <SalesNoteTemplate ref={templateRef} note={viewNote} />
        </div>
      </div>
    </Suspense>
  )

  /* ── form view ── */
  if (mode === 'form') return (
    <div className="sales-note">
      <div className="module-header">
        <div>
          <h2>{editNote ? NV(editNote.folio) : 'Nueva Nota de Venta'}</h2>
          {editNote && <p className="module-sub">Modo edición — pendiente de emisión</p>}
        </div>
        <button type="button" onClick={resetForm}>VOLVER</button>
      </div>

      {/* Cliente */}
      <section className="note-section">
        <p className="section-label">CLIENTE</p>
        <div className="search-suggest">
          <input
            type="text" placeholder="Buscar razón social o RUT…"
            value={clientSearch}
            onChange={(e) => { setCS(e.target.value); setSC(null); setShowCSug(true) }}
            onFocus={() => setShowCSug(true)}
            onBlur={() => setTimeout(() => setShowCSug(false), 150)}
          />
          {showCSug && cSuggestions.length > 0 && (
            <ul className="dropdown">
              {cSuggestions.map((c) => (
                <li key={c.id} onMouseDown={() => { setSC(c); setCS(c.razonSocial); setShowCSug(false) }}>
                  <strong>{c.razonSocial}</strong><span className="text-muted"> {c.rut}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedClient && (
          <div className="client-card-mini">
            <span><strong>{selectedClient.razonSocial}</strong></span>
            <span className="text-muted">RUT {selectedClient.rut}</span>
            {selectedClient.giro && <span className="text-muted">{selectedClient.giro}</span>}
            <button type="button" onClick={() => { setSC(null); setCS('') }}>CAMBIAR</button>
          </div>
        )}
      </section>

      {/* Productos */}
      <section className="note-section">
        <p className="section-label">AGREGAR PRODUCTOS</p>
        <div className="search-suggest">
          <input
            type="text" placeholder="Buscar por nombre, código o marca…"
            value={prodSearch}
            onChange={(e) => { setPS(e.target.value); setShowPSug(true) }}
            onFocus={() => setShowPSug(true)}
            onBlur={() => setTimeout(() => setShowPSug(false), 150)}
          />
          {showPSug && pSuggestions.length > 0 && (
            <ul className="dropdown">
              {pSuggestions.map((p) => (
                <li key={p.barcode} onMouseDown={() => addProduct(p)}>
                  <span>{p.name}{p.variante ? ` — ${p.variante}` : ''}</span>
                  <span className="dropdown-meta">{p.marca} · {formatCLP(p.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Detalle */}
      {items.length > 0 && (
        <section className="note-section">
          <p className="section-label">DETALLE</p>
          <div className="table-wrap">
            <table className="note-items">
              <thead>
                <tr><th>Item</th><th>P. Unitario</th><th>Cantidad</th><th>Subtotal</th><th></th></tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.barcode}>
                    <td>{i.nombre}</td>
                    <td>{formatCLP(i.precioUnitario)}</td>
                    <td>
                      <input type="number" min="1" value={i.cantidad} className="qty-input"
                        onChange={(e) => updateQty(i.barcode, e.target.value)} />
                    </td>
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
        </section>
      )}

      <section className="note-section">
        <textarea placeholder="Observaciones…" value={obs} onChange={(e) => setObs(e.target.value)} rows={2} className="obs-textarea" />
      </section>

      <div className="form-actions">
        <button type="submit" onClick={handleSave} disabled={!items.length}>
          {editNote ? 'GUARDAR CAMBIOS' : 'GUARDAR NOTA'}
        </button>
        <button type="button" onClick={handleDraftPreview} disabled={!items.length}>
          VER BORRADOR
        </button>
        <button type="button" onClick={resetForm}>CANCELAR</button>
      </div>
    </div>
  )

  /* ── list view ── */
  return (
    <div className="sales-note">
      <div className="module-header">
        <div>
          <h2>Notas de Venta</h2>
          <p className="module-sub">{notes.filter((n) => n.estado === 'pendiente').length} pendiente(s)</p>
        </div>
        <button type="button" onClick={() => setMode('form')}>NUEVA NOTA</button>
      </div>

      {notes.length === 0 ? (
        <p className="empty-msg">Sin notas de venta registradas.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Folio</th><th>Fecha</th><th>Cliente</th><th>Items</th><th>Total</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {[...notes].reverse().map((n) => (
                <tr key={n.id}>
                  <td className="td-code">{NV(n.folio)}</td>
                  <td>{n.date}</td>
                  <td>{n.cliente?.razonSocial || <span className="text-muted">Sin cliente</span>}</td>
                  <td>{n.items.reduce((a, i) => a + i.cantidad, 0)}</td>
                  <td>{formatCLP(n.total)}</td>
                  <td><span className={`status-badge status--${n.estado}`}>{ESTADO_LABEL[n.estado]}</span></td>
                  <td>
                    <button type="button" onClick={() => { setDraftNote(null); setViewNoteId(n.id) }}>VER</button>
                    {n.estado === 'pendiente' && (
                      <>
                        <button type="button" onClick={() => startEdit(n)}>EDITAR</button>
                        <button type="button" onClick={() => onEmit(n)}>EMITIR</button>
                      </>
                    )}
                    <button type="button" className="btn-danger" onClick={() => onRemove(n.id)}>ELIMINAR</button>
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
