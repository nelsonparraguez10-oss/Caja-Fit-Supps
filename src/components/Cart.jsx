import { calcNeto, calcIVA, formatCLP } from '../utils/calculations'

const CHANNELS = [
  { key: 'POS',  label: 'PUNTO DE VENTA' },
  { key: 'ECOM', label: 'E-COMMERCE'     },
]

const POS_PAYMENTS = [
  { key: 'cash',     label: 'Efectivo'      },
  { key: 'transfer', label: 'Transferencia' },
  { key: 'card',     label: 'Tarjeta'       },
]

export function Cart({
  items, channel, setChannel,
  paymentMethod, setPaymentMethod,
  ecomReceived, setEcomReceived,
  cobroEnvio, setCobroEnvio,
  costoEnvio, setCostoEnvio,
  listTotal, effectiveTotal, cardCommission, shippingMargin,
  onRemove, onUpdateQuantity, onCheckout,
}) {
  const netoEfectivo = calcNeto(effectiveTotal)
  const ivaEfectivo  = calcIVA(effectiveTotal)
  const shipCobro    = parseFloat(cobroEnvio) || 0
  const shipCosto    = parseFloat(costoEnvio) || 0

  return (
    <div className="cart">
      {/* Canal */}
      <div className="channel-tabs">
        {CHANNELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setChannel(key)}
            className={`channel-tab${channel === key ? ' channel-tab--active' : ''}`}
            tabIndex={-1}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <p className="cart__empty">Sin productos. Escanee o ingrese un código.</p>
      ) : (
        <div className="cart__items">
          {items.map((item) => (
            <div key={item.barcode} className="cart-item">
              <div className="cart-item__info">
                <span className="cart-item__name">{item.name}</span>
                <span className="cart-item__unit">{formatCLP(item.price)} c/u</span>
              </div>
              <div className="cart-item__controls">
                <button className="qty-btn" onClick={() => onUpdateQuantity(item.barcode, item.quantity - 1)} tabIndex={-1}>−</button>
                <span className="qty-val">{item.quantity}</span>
                <button className="qty-btn" onClick={() => onUpdateQuantity(item.barcode, item.quantity + 1)} tabIndex={-1}>+</button>
                <span className="cart-item__sub">{formatCLP(item.subtotal)}</span>
                <button className="btn-eliminar" onClick={() => onRemove(item.barcode)} tabIndex={-1}>ELIMINAR</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <>
          {/* Totales de producto */}
          <div className="cart__totals">
            {channel === 'ECOM' ? (
              <>
                <div className="total-row">
                  <span>Total de lista</span>
                  <span>{formatCLP(listTotal)}</span>
                </div>
                <div className="total-row total-row--input">
                  <label htmlFor="ecom-received">Monto recibido (post-comisión MP)</label>
                  <input
                    id="ecom-received"
                    type="number"
                    value={ecomReceived}
                    onChange={(e) => setEcomReceived(e.target.value)}
                    placeholder={String(listTotal)}
                    className="inline-input"
                    min="0"
                    step="1"
                  />
                </div>
                <div className="total-row">
                  <span>IVA sobre recibido</span>
                  <span>{formatCLP(ivaEfectivo)}</span>
                </div>
                <div className="total-row total-row--grand">
                  <span>Neto real ingresado</span>
                  <span>{formatCLP(netoEfectivo)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="total-row">
                  <span>Neto</span>
                  <span>{formatCLP(calcNeto(listTotal))}</span>
                </div>
                <div className="total-row">
                  <span>IVA 19%</span>
                  <span>{formatCLP(calcIVA(listTotal))}</span>
                </div>
                <div className="total-row total-row--grand">
                  <span>Total</span>
                  <span>{formatCLP(listTotal)}</span>
                </div>
              </>
            )}
          </div>

          {/* Método de pago (solo POS) */}
          {channel === 'POS' && (
            <div className="cart__section">
              <p className="section-label">MÉTODO DE PAGO</p>
              <div className="payment-tabs">
                {POS_PAYMENTS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setPaymentMethod(key)}
                    className={`payment-tab${paymentMethod === key ? ' payment-tab--active' : ''}`}
                    tabIndex={-1}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {paymentMethod === 'card' && (
                <p className="commission-note">Comisión tarjeta: {formatCLP(cardCommission)}</p>
              )}
            </div>
          )}

          {/* Logística */}
          <div className="cart__section">
            <p className="section-label">LOGISTICA</p>
            <div className="shipping-fields">
              <div className="shipping-field">
                <label>Cobro envío al cliente</label>
                <input
                  type="number"
                  value={cobroEnvio}
                  onChange={(e) => setCobroEnvio(e.target.value)}
                  placeholder="0"
                  className="inline-input"
                  min="0"
                  step="1"
                  tabIndex={-1}
                />
              </div>
              <div className="shipping-field">
                <label>Costo real del envío</label>
                <input
                  type="number"
                  value={costoEnvio}
                  onChange={(e) => setCostoEnvio(e.target.value)}
                  placeholder="0"
                  className="inline-input"
                  min="0"
                  step="1"
                  tabIndex={-1}
                />
              </div>
            </div>
            {(shipCobro > 0 || shipCosto > 0) && (
              <p className={`shipping-margin ${shippingMargin >= 0 ? 'shipping-margin--pos' : 'shipping-margin--neg'}`}>
                Margen logístico: {formatCLP(shippingMargin)}
              </p>
            )}
          </div>

          <button className="btn-checkout" onClick={onCheckout}>
            REGISTRAR VENTA — {formatCLP(effectiveTotal + shipCobro)}
          </button>
        </>
      )}
    </div>
  )
}