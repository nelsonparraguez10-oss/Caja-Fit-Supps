import { forwardRef } from 'react'
import { formatCLP } from '../utils/calculations'
import { numberToWords } from '../utils/numberToWords'
import logo from '../../Documentos/Nota de ventas/Logo para nota de ventas y facturas.png'

const EMISOR = {
  razonSocial: 'Fit Supps SpA.',
  rut:         '78.105.927-7',
  giro:        'Venta de suplementos y accesorios deportivos',
  direccion:   'Romilio Labarca #134 Local 2',
  ciudad:      'Santiago',
  email:       'fitsupps2025@gmail.com',
  sii:         'SANTIAGO',
}

const PAGO_LABELS = {
  contado:         'CONTADO',
  transferencia:   'TRANSFERENCIA',
  credito30:       'AL CRÉDITO — 30 DÍAS',
  credito60:       'AL CRÉDITO — 60 DÍAS',
}

const pad6 = (n) => String(n).padStart(6, '0')

function FolioBox({ tipo, folio }) {
  const isFactura = tipo === 'factura'
  return (
    <div className={`dp-folio-box ${isFactura ? 'dp-folio-box--factura' : 'dp-folio-box--boleta'}`}>
      <p className="dp-folio-rut">R.U.T.: {EMISOR.rut}</p>
      <p className="dp-folio-type">
        {isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA'}
      </p>
      {isFactura && <p className="dp-folio-afecta">AFECTA</p>}
      <p className="dp-folio-num">N° {pad6(folio)}</p>
      {isFactura && <p className="dp-folio-sii">S.I.I. — {EMISOR.sii}</p>}
    </div>
  )
}

export const InvoiceTemplate = forwardRef(function InvoiceTemplate({ doc }, ref) {
  const isFactura = doc.tipoDocumento === 'factura'
  const items     = doc.items ?? []
  const rc        = doc.receptor

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
            {isFactura && <p>S.I.I.: {EMISOR.sii}</p>}
            <p>{EMISOR.email}</p>
          </div>
        </div>
        <FolioBox tipo={doc.tipoDocumento} folio={doc.folio} />
      </div>

      {/* ── Condiciones ── */}
      <div className="dp-conditions">
        <span className="dp-conditions-label">CONDICIONES DE VENTA:</span>{' '}
        <strong>{PAGO_LABELS[doc.formaPago] ?? doc.formaPago}</strong>
        <span className="dp-conditions-sep">|</span>
        <span className="dp-conditions-label">FECHA:</span>{' '}
        <strong>{doc.fechaEmision}</strong>
      </div>

      {/* ── Receptor (solo factura) ── */}
      {isFactura && rc && (
        <div className="dp-receptor">
          <table className="dp-receptor-table">
            <tbody>
              <tr>
                <td className="dp-field-label">SEÑOR(ES)</td>
                <td className="dp-field-value dp-field-wide">{rc.razonSocial}</td>
                <td className="dp-field-label">R.U.T.</td>
                <td className="dp-field-value">{rc.rut}</td>
              </tr>
              <tr>
                <td className="dp-field-label">GIRO</td>
                <td className="dp-field-value" colSpan={3}>{rc.giro || '—'}</td>
              </tr>
              <tr>
                <td className="dp-field-label">DIRECCIÓN</td>
                <td className="dp-field-value dp-field-wide">{rc.direccion || '—'}</td>
                <td className="dp-field-label">CIUDAD</td>
                <td className="dp-field-value">{rc.comuna || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Receptor (boleta — consumidor final) ── */}
      {!isFactura && (
        <div className="dp-receptor dp-receptor--simple">
          <span className="dp-field-label">RECEPTOR:</span>{' '}
          <span>CONSUMIDOR FINAL</span>
        </div>
      )}

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
          {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
            <tr key={`empty-${i}`} className="dp-row-empty">
              <td className="dp-col-num">&nbsp;</td><td></td><td></td><td></td><td></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Totales ── */}
      <div className="dp-bottom">
        <div className="dp-obs-block">
          {isFactura && (
            <p className="dp-words">
              <strong>SON:</strong> {numberToWords(doc.total)}
            </p>
          )}
        </div>
        <div className="dp-totals">
          {isFactura && (
            <div className="dp-total-row"><span>EXENTO</span><span>$0</span></div>
          )}
          <div className="dp-total-row"><span>NETO</span><span>{formatCLP(doc.neto)}</span></div>
          <div className="dp-total-row"><span>I.V.A. 19%</span><span>{formatCLP(doc.iva)}</span></div>
          <div className="dp-total-row dp-total-grand"><span>TOTAL</span><span>{formatCLP(doc.total)}</span></div>
        </div>
      </div>

      {/* ── Referencias (solo factura) ── */}
      {isFactura && doc.referencias?.length > 0 && (
        <div className="dp-refs-section">
          <p className="dp-section-title">REFERENCIAS</p>
          <table className="dp-refs-table">
            <thead>
              <tr>
                <th>TIPO DOC.</th><th>FOLIO REF.</th><th>FECHA</th><th>RAZÓN DE REFERENCIA</th>
              </tr>
            </thead>
            <tbody>
              {doc.referencias.map((r, i) => (
                <tr key={i}>
                  <td>{r.tipo}</td>
                  <td>{r.folio ? String(r.folio).padStart(4, '0') : '—'}</td>
                  <td>{r.fecha || '—'}</td>
                  <td>{r.razon || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Cedible (solo factura) ── */}
      {isFactura && (
        <div className="dp-cedible">
          <p className="dp-cedible-title">CEDIBLE</p>
          <p>
            El crédito que origina este documento es cedible de acuerdo a lo establecido
            en la Ley N° 19.983. La cesión de este crédito debe ser notificada por el
            cesionario al deudor de la factura, a la dirección señalada en el documento.
          </p>
        </div>
      )}

      {/* ── Pie ── */}
      <div className="dp-footer">
        <p>
          {isFactura
            ? `Documento Tributario Electrónico — ${EMISOR.razonSocial} · R.U.T. ${EMISOR.rut}`
            : `Boleta Electrónica — ${EMISOR.razonSocial} · R.U.T. ${EMISOR.rut}`}
        </p>
      </div>

    </div>
  )
})