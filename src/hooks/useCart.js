import { useState, useCallback } from 'react'
import { calcCommissionFromCfg } from '../utils/calculations'

export function useCart(cfg, products) {
  const [items, setItems]                         = useState([])
  const [channel, setChannel]                     = useState('POS')
  const [paymentMethod, _setPaymentMethod]        = useState('cash')
  const [cardBrand, setCardBrand]                 = useState(null) // 'visa' | 'mastercard' | null
  const [ecomReceived, setEcomReceived]           = useState('')
  const [cobroEnvio, setCobroEnvio]               = useState('')
  const [costoEnvio, setCostoEnvio]               = useState('')
  const [discount, setDiscount]                   = useState('')

  // Al cambiar método de pago, resetea la marca seleccionada
  const setPaymentMethod = useCallback((method) => {
    _setPaymentMethod(method)
    setCardBrand(null)
  }, [])

  const addItem = useCallback((barcode) => {
    const product = (products ?? []).find((p) => p.barcode === barcode)
    if (!product) return { error: 'Producto no encontrado' }
    if (product.stock <= 0) return { error: 'Sin stock disponible' }

    let result = { product }

    setItems((prev) => {
      const existing = prev.find((i) => i.barcode === barcode)
      if (existing) {
        if (existing.quantity >= product.stock) {
          result = { error: 'Stock insuficiente' }
          return prev
        }
        return prev.map((i) =>
          i.barcode === barcode
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
            : i,
        )
      }
      return [
        ...prev,
        {
          barcode:  product.barcode,
          name:     product.name,
          variante: product.variante || '',
          price:    product.price,
          cost:     product.cost,
          quantity: 1,
          subtotal: product.price,
        },
      ]
    })

    return result
  }, [products])

  const removeItem = useCallback((barcode) => {
    setItems((prev) => prev.filter((i) => i.barcode !== barcode))
  }, [])

  const updateQuantity = useCallback(
    (barcode, quantity) => {
      if (quantity <= 0) { removeItem(barcode); return }
      setItems((prev) =>
        prev.map((i) =>
          i.barcode === barcode ? { ...i, quantity, subtotal: quantity * i.price } : i,
        ),
      )
    },
    [removeItem],
  )

  const clearCart = useCallback(() => {
    setItems([])
    setChannel('POS')
    _setPaymentMethod('cash')
    setCardBrand(null)
    setEcomReceived('')
    setCobroEnvio('')
    setCostoEnvio('')
    setDiscount('')
  }, [])

  const listTotal = items.reduce((acc, i) => acc + i.subtotal, 0)

  const discountPct    = Math.min(100, Math.max(0, parseFloat(discount) || 0))
  const discountAmount = Math.round(listTotal * discountPct / 100)
  const discountedListTotal = listTotal - discountAmount

  const effectiveTotal =
    channel === 'ECOM'
      ? (parseFloat(ecomReceived) || discountedListTotal)
      : discountedListTotal

  const cardCommission =
    channel === 'POS' && (paymentMethod === 'debito' || paymentMethod === 'credito')
      ? calcCommissionFromCfg(discountedListTotal, cfg, paymentMethod, cardBrand)
      : 0

  const mpCommission =
    channel === 'ECOM'
      ? calcCommissionFromCfg(discountedListTotal, cfg, 'mercadopago')
      : 0

  const shippingMargin = (parseFloat(cobroEnvio) || 0) - (parseFloat(costoEnvio) || 0)

  return {
    items,
    channel,        setChannel,
    paymentMethod,  setPaymentMethod,
    cardBrand,      setCardBrand,
    ecomReceived,   setEcomReceived,
    cobroEnvio,     setCobroEnvio,
    costoEnvio,     setCostoEnvio,
    discount,       setDiscount,
    listTotal,
    discountPct,
    discountAmount,
    discountedListTotal,
    effectiveTotal,
    cardCommission,
    mpCommission,
    shippingMargin,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }
}
