import { useState, useCallback } from 'react'
import { calcCommissionFromCfg } from '../utils/calculations'
import { products as dbProducts } from '../data/db'

export function useCart(cfg) {
  const [items, setItems]                   = useState([])
  const [channel, setChannel]               = useState('POS')
  const [paymentMethod, setPaymentMethod]   = useState('cash')
  const [ecomReceived, setEcomReceived]     = useState('')
  const [cobroEnvio, setCobroEnvio]         = useState('')
  const [costoEnvio, setCostoEnvio]         = useState('')

  const addItem = useCallback((barcode) => {
    const product = dbProducts.findByBarcode(barcode)
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
          price:    product.price,
          cost:     product.cost,
          quantity: 1,
          subtotal: product.price,
        },
      ]
    })

    return result
  }, [])

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
    setPaymentMethod('cash')
    setEcomReceived('')
    setCobroEnvio('')
    setCostoEnvio('')
  }, [])

  const listTotal = items.reduce((acc, i) => acc + i.subtotal, 0)

  const effectiveTotal =
    channel === 'ECOM'
      ? (parseFloat(ecomReceived) || listTotal)
      : listTotal

  // Comisión aplica en POS débito/crédito, y en ECOM se calcula para referencia
  const cardCommission =
    channel === 'POS' && (paymentMethod === 'debito' || paymentMethod === 'credito')
      ? calcCommissionFromCfg(listTotal, cfg, paymentMethod)
      : 0

  const mpCommission =
    channel === 'ECOM'
      ? calcCommissionFromCfg(listTotal, cfg, 'mercadopago')
      : 0

  const shippingMargin = (parseFloat(cobroEnvio) || 0) - (parseFloat(costoEnvio) || 0)

  return {
    items,
    channel,       setChannel,
    paymentMethod, setPaymentMethod,
    ecomReceived,  setEcomReceived,
    cobroEnvio,    setCobroEnvio,
    costoEnvio,    setCostoEnvio,
    listTotal,
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