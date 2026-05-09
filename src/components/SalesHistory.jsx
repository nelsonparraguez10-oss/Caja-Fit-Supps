import { useState } from 'react'
import { formatCLP } from '../utils/calculations'

const METHOD_LABELS = {
  cash:        'Efectivo',
  transfer:    'Transferencia',
  debito:      'Débito',
  credito:     'Crédito',
  mercadopago: 'Mercado Pago',
  card:        'Tarjeta',
}

const formatDateTime = (iso) => {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
  }
}

const summarizeItems = (items) =>
  items.length === 1
    ? `${items[0].name} ×${items[0].quantity}`
    : `${items.length} productos`

export function SalesHistory({ sales, onVoid }) {
  const [voidTarget, setVoidTarget] = useState(null)

  const sorted  = [...sales].reverse()
  const active  = sales.filter((s) => s.status !== 'VOIDED').length
  const voided  = sales.filter((s) => s.status === 'VOIDED').length

  const confirmVoid = () => {
    onVoid(voidTarget.id)
    setVoidTarget(null)
  }

  return (
    <div className="sales-history">
      <div className="module-header">
        <div>
          <h2>Historial de Ventas</h2>
          <p className="module-sub">{active} activa(s) · {voided} anulada(s)</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="empty-msg">Sin ventas registradas.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>FECHA / HORA</th>
                <th>ID VENTA</th>
                <th>CANAL</th>
                <th>MÉTODO</th>
                <th>ARTÍCULOS</th>
                <th>TOTAL</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((sale) => {
                const { date, time } = formatDateTime(sale.date)
                const isVoided = sale.status === 'VOIDED'
                return (
                  <tr key={sale.id} className={isVoided ? 'row--voided' : ''}>
                    <td>
                      <div className="sale-datetime">
                        <span>{date}</span>
                        <span className="text-muted">{time}</span>
                      </div>
                    </td>
                    <td className="td-code">{sale.id.slice(0, 8).toUpperCase()}</td>
                    <td>
                      <span className={`sale-channel-badge sale-channel-badge--${(sale.channel || 'POS').toLowerCase()}`}>
                        {sale.channel || 'POS'}
                      </span>
                    </td>
                    <td className="text-muted">{METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod || '—'}</td>
                    <td className="text-muted">{summarizeItems(sale.items)}</td>
                    <td>
                      <strong className={isVoided ? 'text-muted' : ''}>
                        {formatCLP(sale.effectiveTotal ?? sale.total)}
                      </strong>
                    </td>
                    <td>
                      {isVoided ? (
                        <span className="badge-voided">ANULADA</span>
                      ) : (
                        <button className="btn-void" onClick={() => setVoidTarget(sale)}>
                          ANULAR
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {voidTarget && (
        <div className="void-overlay" onClick={() => setVoidTarget(null)}>
          <div className="void-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="void-modal__title">Anular venta</h3>
            <p className="void-modal__body">
              ¿Confirmas anular la venta{' '}
              <strong>{voidTarget.id.slice(0, 8).toUpperCase()}</strong>?
              <br />
              El stock de {voidTarget.items.length} producto(s) será devuelto al inventario
              y la venta quedará excluida de las analíticas.
            </p>
            <div className="void-modal__actions">
              <button className="void-modal__cancel" onClick={() => setVoidTarget(null)}>
                CANCELAR
              </button>
              <button className="void-modal__confirm" onClick={confirmVoid}>
                CONFIRMAR ANULACIÓN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}