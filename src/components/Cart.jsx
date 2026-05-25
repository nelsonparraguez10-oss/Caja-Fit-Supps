import { calcNeto, calcIVA, formatCLP, IVA_RATE } from '../utils/calculations'
import { DailySummary } from './DailySummary'

const CHANNELS = [
  { key: 'POS',  label: 'PUNTO DE VENTA' },
  { key: 'ECOM', label: 'E-COMMERCE'     },
]

const POS_PAYMENTS = [
  { key: 'cash',     label: 'Efectivo'      },
  { key: 'transfer', label: 'Transferencia' },
  { key: 'debito',   label: 'Débito'        },
  { key: 'credito',  label: 'Crédito'       },
]

export function Cart({
  items, channel, setChannel,
  paymentMethod, setPaymentMethod,
  cardBrand, setCardBrand,
  ecomReceived, setEcomReceived,
  cobroEnvio, setCobroEnvio,
  costoEnvio, setCostoEnvio,
  discount, setDiscount,
  listTotal, discountPct, discountAmount, discountedListTotal,
  effectiveTotal, cardCommission, mpCommission, shippingMargin,
  cfg, sales,
  onRemove, onUpdateQuantity, onCheckout,
}) {
  const netoEfectivo = calcNeto(effectiveTotal)
  const ivaEfectivo  = calcIVA(effectiveTotal)
  const shipCobro    = parseFloat(cobroEnvio) || 0
  const shipCosto    = parseFloat(costoEnvio) || 0

  const mpRate   = cfg?.mercadopago?.rate ?? 5.99
  const posType  = cfg?.posType ?? 'getnet'
  const ufValue  = cfg?.ufValue ?? 38500

  const getnetBrandComm = (pmType, brand) => {
    const r = cfg?.getnet?.[pmType]?.[brand]
    if (!r) return 0
    return Math.round((effectiveTotal * (r.rate / 100) + r.fixedUF * ufValue) * (1 + IVA_RATE))
  }

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
        <DailySummary sales={sales ?? []} />
      ) : (
        <div className="cart__items">
          {items.map((item) => (
            <div key={item.barcode} className="cart-item">
              <div className="cart-item__info">
                <div className="cart-item__name-wrap">
                  <span className="cart-item__name">{item.name}</span>
                  {item.variante && (
                    <span className="cart-item__variante">{item.variante}</span>
                  )}
                </div>
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
          {/* Descuento */}
          <div className="cart__section">
            <p className="section-label">DESCUENTO</p>
            <div className="discount-field">
              <label htmlFor="discount-pct">Porcentaje de descuento</label>
              <div className="discount-input-wrap">
                <input
                  id="discount-pct"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="inline-input"
                  min="0"
                  max="100"
                  step="1"
                  tabIndex={-1}
                />
                <span className="discount-pct-symbol">%</span>
              </div>
            </div>
          </div>

          {/* Totales */}
          <div className="cart__totals">
            {channel === 'ECOM' ? (
              <>
                <div className="total-row">
                  <span>Total de lista</span>
                  <span>{formatCLP(listTotal)}</span>
                </div>
                {discountPct > 0 && (
                  <div className="total-row">
                    <span>Descuento ({discountPct}%)</span>
                    <span className="text-warn">−{formatCLP(discountAmount)}</span>
                  </div>
                )}
                <div className="total-row">
                  <span>Comisión MP estimada ({mpRate}%)</span>
                  <span className="text-warn">−{formatCLP(mpCommission)}</span>
                </div>
                <div className="total-row total-row--input">
                  <label htmlFor="ecom-received">Monto recibido (post-MP)</label>
                  <input
                    id="ecom-received"
                    type="number"
                    value={ecomReceived}
                    onChange={(e) => setEcomReceived(e.target.value)}
                    placeholder={String(discountedListTotal - mpCommission)}
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
                {discountPct > 0 && (
                  <div className="total-row">
                    <span>Total de lista</span>
                    <span>{formatCLP(listTotal)}</span>
                  </div>
                )}
                {discountPct > 0 && (
                  <div className="total-row">
                    <span>Descuento ({discountPct}%)</span>
                    <span className="text-warn">−{formatCLP(discountAmount)}</span>
                  </div>
                )}
                <div className="total-row">
                  <span>Neto</span>
                  <span>{formatCLP(calcNeto(effectiveTotal))}</span>
                </div>
                <div className="total-row">
                  <span>IVA 19%</span>
                  <span>{formatCLP(calcIVA(effectiveTotal))}</span>
                </div>
                <div className="total-row total-row--grand">
                  <span>Total</span>
                  <span>{formatCLP(effectiveTotal)}</span>
                </div>
              </>
            )}
          </div>

          {/* Método de pago (POS) */}
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
              {(paymentMethod === 'debito' || paymentMethod === 'credito') && posType === 'getnet' && (
                <div className="brand-selector">
                  <span className="brand-selector__label">Marca</span>
                  {['visa', 'mastercard'].map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      tabIndex={-1}
                      onClick={() => setCardBrand(cardBrand === brand ? null : brand)}
                      className={`brand-btn brand-btn--${brand}${cardBrand === brand ? ' brand-btn--active' : ''}`}
                    >
                      {brand === 'visa' ? 'Visa' : 'Mastercard'}
                    </button>
                  ))}
                </div>
              )}
              {(paymentMethod === 'debito' || paymentMethod === 'credito') && (
                <div className="commission-note">
                  {posType === 'getnet' ? (
                    cardBrand ? (
                      <span>
                        Comisión {paymentMethod === 'debito' ? 'débito' : 'crédito'} {cardBrand === 'visa' ? 'Visa' : 'Mastercard'} (incl. IVA): {formatCLP(cardCommission)}
                      </span>
                    ) : (
                      <>
                        <span>Est. comisión {paymentMethod === 'debito' ? 'débito' : 'crédito'} Getnet (incl. IVA):</span>
                        <span>
                          Visa {formatCLP(getnetBrandComm(paymentMethod, 'visa'))} &nbsp;|&nbsp;
                          MC {formatCLP(getnetBrandComm(paymentMethod, 'mastercard'))}
                        </span>
                      </>
                    )
                  ) : (
                    <span>
                      Comisión {paymentMethod === 'debito' ? 'débito' : 'crédito'} (
                      {paymentMethod === 'debito'
                        ? cfg?.tuu?.debito?.rate ?? 1.49
                        : cfg?.tuu?.credito?.rate ?? 1.99}%): {formatCLP(cardCommission)}
                    </span>
                  )}
                </div>
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