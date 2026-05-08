export const IVA_RATE = 0.19
export const CARD_RATE = 0.007
export const CARD_FIXED = 80

export const calcNeto = (totalConIVA) => totalConIVA / (1 + IVA_RATE)
export const calcIVA  = (totalConIVA) => totalConIVA - calcNeto(totalConIVA)
export const calcCardCommission = (total) => total * CARD_RATE + CARD_FIXED

export const formatCLP = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Math.round(n || 0))

// Capital inmovilizado en inventario al costo neto
export const calcInventoryCapital = (prods) =>
  prods.reduce((acc, p) => acc + p.stock * calcNeto(p.cost), 0)

export const calcAnalytics = (sales, expenses) => {
  // Venta bruta = monto real recibido (ECOM usa override MP, POS usa precio lista)
  const ventasBrutas   = sales.reduce((acc, s) => acc + (s.effectiveTotal ?? s.total ?? 0), 0)
  const ivaTotalVentas = calcIVA(ventasBrutas)
  const ventasNetas    = calcNeto(ventasBrutas)

  // Débito Fiscal = IVA de las ventas (lo que se debe al SII)
  const debitoFiscal = ivaTotalVentas

  // Crédito Fiscal = IVA de gastos con FACTURA (lo que se recupera del SII)
  const creditoFiscal = expenses.reduce((acc, e) => acc + (e.ivaCredito || 0), 0)

  // IVA Por Pagar al SII
  const ivaPorPagar = Math.max(0, debitoFiscal - creditoFiscal)

  // Comisiones tarjeta POS
  const comisionesTargeta = sales
    .filter((s) => s.paymentMethod === 'card')
    .reduce((acc, s) => acc + (s.cardCommission || 0), 0)

  // Logística
  const ingresoEnvios = sales.reduce((acc, s) => acc + (s.shipping?.cobro || 0), 0)
  const costoEnvios   = sales.reduce((acc, s) => acc + (s.shipping?.costo || 0), 0)
  const margenEnvios  = ingresoEnvios - costoEnvios

  const gastosBase  = expenses.reduce((acc, e) => acc + e.amount, 0)
  const gastosTotal = gastosBase + comisionesTargeta

  const costoAdquisicion = sales.reduce(
    (acc, s) => acc + s.items.reduce((a, i) => a + (i.cost || 0) * i.quantity, 0),
    0,
  )

  const margenProductos = ventasNetas - costoAdquisicion

  // Utilidad Real = (Venta Neta – Costo) + Margen Envío – Gastos
  const utilidadReal = margenProductos + margenEnvios - gastosTotal

  return {
    ventasBrutas,
    ivaTotalVentas,
    debitoFiscal,
    ventasNetas,
    comisionesTargeta,
    gastosBase,
    gastosTotal,
    costoAdquisicion,
    margenProductos,
    ingresoEnvios,
    costoEnvios,
    margenEnvios,
    utilidadReal,
    creditoFiscal,
    ivaPorPagar,
  }
}