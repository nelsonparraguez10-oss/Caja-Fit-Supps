import { forwardRef } from 'react'
import { formatCLP } from '../utils/calculations'
import logo from '../../Documentos/Nota de ventas/Logo para nota de ventas y facturas.png'

const EMISOR = {
  razonSocial: 'Fit Supps SpA.',
  rut:         '78.105.927-7',
  giro:        'Venta de suplementos y accesorios deportivos',
  direccion:   'Romilio Labarca #134 Local 2',
  ciudad:      'Santiago',
  email:       'fitsupps2025@gmail.com',
}

const folioDisplay = (n) => n > 0 ? `N° ${String(n).padStart(4, '0')}` : 'BORRADOR'

export const SalesNoteTemplate = forwardRef(function SalesNoteTemplate({ note }, ref) {
  const items = note?.items ?? []
  const cl    = note?.cliente

  return (
    <div ref={ref} className="doc-page">

      {/* ── Cabecera ── */}
      <div className="dp-header">
        <div className="dp-logo-block">
          <img src={logo} alt="Fit Supps" className="dp-logo" />
          <div className="dp-emisor">
            <p className="dp-emisor-name">{EMISOR.razonSocial}</p>
            <p>R.U.T.: {EMISOR.rut}</p>
            <p>Giro: {EMISOR.giro}</p>
            <p>{EMISOR.direccion} · {EMISOR.ciudad}</p>
            <p>{EMISOR.email}</p>
          </div>
        </div>

        <div className="dp-folio-box dp-folio-box--nota">
          <p className="dp-folio-rut">R.U.T.: {EMISOR.rut}</p>
          <p className="dp-folio-type">NOTA DE VENTA</p>
          <p className="dp-folio-num">{folioDisplay(note.folio)}</p>
          <hr className="dp-folio-sep" />
          <p className="dp-folio-date">Fecha: {note.date}</p>
        </div>
      </div>

      {/* ── Receptor ── */}
      <div className="dp-receptor">
        <table className="dp-receptor-table">
          <tbody>
            <tr>
              <td className="dp-field-label">SEÑOR(ES)</td>
              <td className="dp-field-value dp-field-wide">{cl?.razonSocial || 'CONSUMIDOR FINAL'}</td>
              <td className="dp-field-label">R.U.T.</td>
              <td className="dp-field-value">{cl?.rut || '—'}</td>
            </tr>
            <tr>
              <td className="dp-field-label">GIRO</td>
              <td className="dp-field-value" colSpan={3}>{cl?.giro || '—'}</td>
            </tr>
            <tr>
              <td className="dp-field-label">DIRECCIÓN</td>
              <td className="dp-field-value dp-field-wide">{cl?.direccion || '—'}</td>
              <td className="dp-field-label">CIUDAD</td>
              <td className="dp-field-value">{cl?.comuna || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Detalle ── */}
      <table className="dp-items">
        <thead>
          <tr>
            <th className="dp-col-num">N°</th>
            <th className="dp-col-desc">DESCRIPCIÓN</th>
            <th className="dp-col-qty">CANT.</th>
            <th className="dp-col-price">VALOR UNITARIO</th>
            <th className="dp-col-sub">SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="dp-col-num">{i + 1}</td>
              <td>{item.nombre}</td>
              <td className="dp-col-qty">{item.cantidad}</td>
              <td className="dp-col-price">{formatCLP(item.precioUnitario)}</td>
              <td className="dp-col-sub">{formatCLP(item.subtotal)}</td>
            </tr>
          ))}
          {/* Filas vacías para dar espacio */}
          {items.length < 6 && Array.from({ length: 6 - items.length }).map((_, i) => (
            <tr key={`empty-${i}`} className="dp-row-empty">
              <td className="dp-col-num">&nbsp;</td><td></td><td></td><td></td><td></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Totales ── */}
      <div className="dp-bottom">
        <div className="dp-obs-block">
          {note.observaciones && (
            <>
              <p className="dp-obs-label">OBSERVACIONES</p>
              <p className="dp-obs-text">{note.observaciones}</p>
            </>
          )}
        </div>
        <div className="dp-totals">
          <div className="dp-total-row"><span>NETO</span><span>{formatCLP(note.neto)}</span></div>
          <div className="dp-total-row"><span>I.V.A. 19%</span><span>{formatCLP(note.iva)}</span></div>
          <div className="dp-total-row dp-total-grand"><span>TOTAL</span><span>{formatCLP(note.total)}</span></div>
        </div>
      </div>

      {/* ── Pie ── */}
      <div className="dp-footer">
        <p>Este documento no tiene valor tributario — Emitido por FIT SUPPS · {EMISOR.email}</p>
      </div>
    </div>
  )
})