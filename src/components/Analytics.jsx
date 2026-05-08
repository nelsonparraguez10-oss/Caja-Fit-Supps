import { useMemo, useState } from 'react'
import { calcAnalytics, calcInventoryCapital, formatCLP } from '../utils/calculations'

const PERIODS    = [{ key: 'today', label: 'Hoy' }, { key: 'week', label: 'Semana' }, { key: 'month', label: 'Mes' }, { key: 'all', label: 'Todo' }]
const PAY_LABELS = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', mercadopago: 'Mercado Pago' }
const CH_LABELS  = { POS: 'Punto de Venta', ECOM: 'E-Commerce' }
const STAGNANT_THRESHOLDS = [{ days: 30, label: '30 d' }, { days: 60, label: '60 d' }, { days: 90, label: '90 d' }]

function filterByPeriod(items, period, key = 'date') {
  const now = new Date()
  return items.filter((item) => {
    const d = new Date(item[key])
    if (period === 'today') return d.toDateString() === now.toDateString()
    if (period === 'week')  return d >= new Date(now - 7 * 86400000)
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return true
  })
}

// Fila de tabla de cascada financiera
function BRow({ label, value, indent, separator, total, hide }) {
  if (hide) return null
  const isNeg = value < 0
  return (
    <tr className={[
      'brow',
      separator ? 'brow--sep'   : '',
      total     ? 'brow--total' : '',
      indent    ? 'brow--indent': '',
    ].filter(Boolean).join(' ')}>
      <td className="brow__label">{label}</td>
      <td className={`brow__value${isNeg ? ' brow__value--neg' : ''}${total ? ' brow__value--total' : ''}`}>
        {formatCLP(value)}
      </td>
    </tr>
  )
}

export function Analytics({ sales, expenses, products }) {
  const [period,           setPeriod]    = useState('month')
  const [stagnantDays,     setStagnant]  = useState(30)

  const fSales    = useMemo(() => filterByPeriod(sales,    period),        [sales,    period])
  const fExpenses = useMemo(() => filterByPeriod(expenses, period, 'date'), [expenses, period])
  const m         = useMemo(() => calcAnalytics(fSales, fExpenses),         [fSales,   fExpenses])
  const capital   = useMemo(() => calcInventoryCapital(products ?? []),      [products])

  /* ── Tendencia: productos más vendidos en el periodo ── */
  const trending = useMemo(() => {
    const map = {}
    fSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!map[item.barcode]) map[item.barcode] = { barcode: item.barcode, name: item.name, qty: 0, revenue: 0 }
        map[item.barcode].qty     += (item.quantity ?? 1)
        map[item.barcode].revenue += (item.subtotal ?? (item.price * (item.quantity ?? 1)))
      })
    })
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 10)
  }, [fSales])

  /* ── Productos detenidos: sin ventas en N días ── */
  const stagnantProducts = useMemo(() => {
    const now = Date.now()
    const lastSaleMap = {}
    sales.forEach((sale) => {
      const t = new Date(sale.date).getTime()
      sale.items.forEach((item) => {
        if (!lastSaleMap[item.barcode] || t > lastSaleMap[item.barcode]) lastSaleMap[item.barcode] = t
      })
    })
    return (products ?? [])
      .map((p) => {
        const last      = lastSaleMap[p.barcode]
        const daysSince = last ? Math.floor((now - last) / 86400000) : null
        return { ...p, daysSince, neverSold: !last }
      })
      .filter((p) => p.neverSold || p.daysSince >= stagnantDays)
      .sort((a, b) => {
        if (a.neverSold !== b.neverSold) return a.neverSold ? -1 : 1
        return b.daysSince - a.daysSince
      })
      .slice(0, 15)
  }, [sales, products, stagnantDays])

  return (
    <div className="analytics">
      {/* Encabezado */}
      <div className="analytics__header">
        <div>
          <h2>Analiticas</h2>
          <p className="analytics__sub">{fSales.length} venta(s) en el periodo</p>
        </div>
        <div className="period-tabs">
          {PERIODS.map(({ key, label }) => (
            <button key={key} onClick={() => setPeriod(key)} className={period === key ? 'active' : ''}>{label}</button>
          ))}
        </div>
      </div>

      {/* Capital en inventario — siempre vigente (no filtrado por período) */}
      <section className="analytics__card analytics__card--capital">
        <p className="analytics__card-title">CAPITAL EN INVENTARIO</p>
        <p className="capital-value">{formatCLP(capital)}</p>
        <p className="capital-sub">Valor de stock al costo neto actual</p>
      </section>

      {/* Cascada financiera */}
      <section className="analytics__card">
        <h3 className="analytics__card-title">RESUMEN FINANCIERO</h3>
        <table className="breakdown">
          <tbody>
            <BRow label="Venta Bruta (monto recibido)"  value={m.ventasBrutas}      />
            <BRow label="IVA 19% (Debito Fiscal)"        value={-m.ivaTotalVentas}   indent separator />
            <BRow label="Venta Neta"                     value={m.ventasNetas}       />
            <BRow label="Costo de Productos"             value={-m.costoAdquisicion} indent separator />
            <BRow label="Margen Bruto Productos"         value={m.margenProductos}   />
            <BRow label="Cobro Envios (ingreso)"         value={m.ingresoEnvios}     indent hide={m.ingresoEnvios === 0 && m.costoEnvios === 0} />
            <BRow label="Costo Envios (gasto)"           value={-m.costoEnvios}      indent hide={m.ingresoEnvios === 0 && m.costoEnvios === 0} />
            <BRow label="Margen Logistico"               value={m.margenEnvios}      separator hide={m.ingresoEnvios === 0 && m.costoEnvios === 0} />
            <BRow label="Gastos Fijos y Variables"       value={-m.gastosBase}       indent />
            <BRow label="Comisiones Tarjeta"             value={-m.comisionesTargeta} indent hide={m.comisionesTargeta === 0} />
            <BRow label="UTILIDAD REAL"                  value={m.utilidadReal}      total />
          </tbody>
        </table>
      </section>

      {/* Declaración IVA */}
      <section className="analytics__card">
        <h3 className="analytics__card-title">DECLARACION IVA (ESTIMADA)</h3>
        <table className="breakdown">
          <tbody>
            <BRow label="Debito Fiscal (IVA ventas)"       value={m.debitoFiscal}   />
            <BRow label="Credito Fiscal (IVA facturas)"    value={-m.creditoFiscal} indent separator />
            <BRow label="IVA POR PAGAR AL SII"             value={m.ivaPorPagar}    total />
          </tbody>
        </table>
        {m.creditoFiscal === 0 && (
          <p className="iva-tip">Registra gastos con documento FACTURA para acumular credito fiscal.</p>
        )}
      </section>

      {/* Canal + Método de pago */}
      <div className="analytics__grid-2">
        <section className="analytics__card">
          <h3 className="analytics__card-title">POR CANAL</h3>
          <table className="mini-table">
            <thead><tr><th>Canal</th><th>Ventas</th><th>Recibido</th></tr></thead>
            <tbody>
              {['POS', 'ECOM'].map((ch) => {
                const rows  = fSales.filter((s) => (s.channel ?? 'POS') === ch)
                const total = rows.reduce((a, s) => a + (s.effectiveTotal ?? s.total ?? 0), 0)
                return <tr key={ch}><td>{CH_LABELS[ch]}</td><td>{rows.length}</td><td>{formatCLP(total)}</td></tr>
              })}
            </tbody>
          </table>
        </section>

        <section className="analytics__card">
          <h3 className="analytics__card-title">POR METODO DE PAGO</h3>
          <table className="mini-table">
            <thead><tr><th>Metodo</th><th>Ventas</th><th>Total</th></tr></thead>
            <tbody>
              {Object.entries(PAY_LABELS).map(([method, label]) => {
                const rows  = fSales.filter((s) => s.paymentMethod === method)
                const total = rows.reduce((a, s) => a + (s.effectiveTotal ?? s.total ?? 0), 0)
                if (rows.length === 0) return null
                return <tr key={method}><td>{label}</td><td>{rows.length}</td><td>{formatCLP(total)}</td></tr>
              })}
            </tbody>
          </table>
        </section>
      </div>

      {/* Tendencia — más vendidos */}
      <section className="analytics__card">
        <h3 className="analytics__card-title">TENDENCIA — MAS VENDIDOS</h3>
        <p className="analytics__card-sub">Periodo seleccionado · por unidades</p>
        {trending.length === 0 ? (
          <p className="empty-msg">Sin ventas en el periodo.</p>
        ) : (() => {
          const maxQty = trending[0].qty
          return (
            <div className="trend-list">
              {trending.map((p, i) => (
                <div key={p.barcode} className="trend-row">
                  <span className="trend-rank">#{i + 1}</span>
                  <div className="trend-info">
                    <span className="trend-name">{p.name}</span>
                    <div className="trend-bar-wrap">
                      <div className="trend-bar" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                    </div>
                  </div>
                  <span className="trend-qty">{p.qty} u</span>
                  <span className="trend-rev">{formatCLP(p.revenue)}</span>
                </div>
              ))}
            </div>
          )
        })()}
      </section>

      {/* Productos detenidos */}
      <section className="analytics__card">
        <div className="analytics__card-header-row">
          <div>
            <h3 className="analytics__card-title">PRODUCTOS DETENIDOS</h3>
            <p className="analytics__card-sub">Sin ventas en el historial completo</p>
          </div>
          <div className="period-tabs period-tabs--sm">
            {STAGNANT_THRESHOLDS.map(({ days, label }) => (
              <button key={days} onClick={() => setStagnant(days)} className={stagnantDays === days ? 'active' : ''}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {stagnantProducts.length === 0 ? (
          <p className="empty-msg">Todos los productos se vendieron en este rango.</p>
        ) : (
          <table className="mini-table">
            <thead>
              <tr><th>Producto</th><th>Marca</th><th>Stock</th><th>Ultima Venta</th></tr>
            </thead>
            <tbody>
              {stagnantProducts.map((p) => (
                <tr key={p.barcode}>
                  <td>{p.name}{p.variante ? <span className="text-muted"> — {p.variante}</span> : ''}</td>
                  <td className="text-muted">{p.marca || '—'}</td>
                  <td>{p.stock ?? 0}</td>
                  <td>
                    {p.neverSold
                      ? <span className="stagnant-badge stagnant-badge--never">Sin ventas</span>
                      : <span className={`stagnant-badge ${p.daysSince >= 90 ? 'stagnant-badge--critical' : 'stagnant-badge--warn'}`}>
                          hace {p.daysSince} días
                        </span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Historial */}
      <section className="analytics__card">
        <h3 className="analytics__card-title">HISTORIAL DE VENTAS</h3>
        {fSales.length === 0 ? (
          <p className="empty-msg">Sin ventas en el periodo seleccionado.</p>
        ) : (
          <table className="mini-table">
            <thead>
              <tr><th>Fecha</th><th>Canal</th><th>Items</th><th>Recibido</th><th>Pago</th><th>Envio</th></tr>
            </thead>
            <tbody>
              {[...fSales].reverse().slice(0, 100).map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.date).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{CH_LABELS[s.channel ?? 'POS']}</td>
                  <td>{s.items.reduce((a, i) => a + i.quantity, 0)}</td>
                  <td>{formatCLP(s.effectiveTotal ?? s.total)}</td>
                  <td>{PAY_LABELS[s.paymentMethod] ?? s.paymentMethod}</td>
                  <td>{s.shipping?.cobro || s.shipping?.costo ? `${formatCLP(s.shipping.cobro)} / ${formatCLP(s.shipping.costo)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
