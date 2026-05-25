export const IVA_RATE = 0.19

export const calcNeto = (totalConIVA) => totalConIVA / (1 + IVA_RATE)
export const calcIVA  = (totalConIVA) => totalConIVA - calcNeto(totalConIVA)

export const calcCommissionFromCfg = (total, cfg, paymentMethod, cardBrand = null) => {
  const posType = cfg?.posType ?? 'getnet'
  const ufValue = cfg?.ufValue ?? 38500

  if (paymentMethod === 'debito' || paymentMethod === 'credito') {
    if (posType === 'getnet') {
      const t = cfg?.getnet?.[paymentMethod]
      if (!t) return 0
      // Si se conoce la marca, usa su tarifa exacta
      if (cardBrand === 'visa' || cardBrand === 'mastercard') {
        const r = t[cardBrand]
        return Math.round((total * ((r?.rate ?? 0) / 100) + (r?.fixedUF ?? 0) * ufValue) * 1.19)
      }
      // Sin marca: promedio como estimado
      const visaComm = (total * ((t.visa?.rate ?? 0) / 100) + (t.visa?.fixedUF ?? 0) * ufValue) * 1.19
      const mcComm   = (total * ((t.mastercard?.rate ?? 0) / 100) + (t.mastercard?.fixedUF ?? 0) * ufValue) * 1.19
      return Math.round((visaComm + mcComm) / 2)
    }
    if (posType === 'tuu') {
      const { rate = 1.49, fixed = 0 } = cfg?.tuu?.[paymentMethod] ?? {}
      return Math.round(total * (rate / 100) + fixed)
    }
    return 0
  }

  if (paymentMethod === 'mercadopago' || paymentMethod === 'card') {
    const { rate = 5.99, fixed = 0 } = cfg?.mercadopago ?? {}
    return Math.round(total * (rate / 100) + fixed)
  }

  return 0
}

export const formatCLP = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Math.round(n || 0))

// Capital inmovilizado en inventario al costo neto
export const calcInventoryCapital = (prods) =>
  prods.reduce((acc, p) => acc + p.stock * calcNeto(p.cost), 0)

export const calcAnalytics = (sales, expenses, docs = []) => {
  const activeSales = sales.filter((s) => s.status !== 'VOIDED')
  const activeDocs  = docs.filter((d) => d.estado !== 'ANULADA')

  // ── Ventas Retail (POS / ECOM) ───────────────────────────────────────────────
  const ventasRetailBrutas = activeSales.reduce((acc, s) => acc + (s.effectiveTotal ?? s.total ?? 0), 0)

  // ── Ventas Mayoristas (Documentos emitidos activos) ──────────────────────────
  const ventasMayoristaBrutas = activeDocs.reduce((acc, d) => acc + (d.total || 0), 0)

  // ── Totales combinados ───────────────────────────────────────────────────────
  const ventasBrutas   = ventasRetailBrutas + ventasMayoristaBrutas
  const ivaTotalVentas = calcIVA(ventasBrutas)
  const ventasNetas    = calcNeto(ventasBrutas)

  // Débito Fiscal = IVA de las ventas (lo que se debe al SII)
  const debitoFiscal = ivaTotalVentas

  // Crédito Fiscal = IVA de gastos con FACTURA (lo que se recupera del SII)
  const creditoFiscal = expenses.reduce((acc, e) => acc + (e.ivaCredito || 0), 0)

  // IVA Por Pagar al SII
  const ivaPorPagar = Math.max(0, debitoFiscal - creditoFiscal)

  // Comisiones tarjeta POS (card legacy + debito + credito)
  const comisionesTargeta = activeSales
    .filter((s) => ['card', 'debito', 'credito'].includes(s.paymentMethod))
    .reduce((acc, s) => acc + (s.cardCommission || 0), 0)

  // Logística (solo ventas retail)
  const ingresoEnvios = activeSales.reduce((acc, s) => acc + (s.shipping?.cobro || 0), 0)
  const costoEnvios   = activeSales.reduce((acc, s) => acc + (s.shipping?.costo || 0), 0)
  const margenEnvios  = ingresoEnvios - costoEnvios

  const gastosBase  = expenses.reduce((acc, e) => acc + e.amount, 0)
  const gastosTotal = gastosBase + comisionesTargeta

  const costoRetail = activeSales.reduce(
    (acc, s) => acc + (s.items ?? []).reduce((a, i) => a + (i.cost || 0) * i.quantity, 0), 0,
  )
  const costoMayorista = activeDocs.reduce(
    (acc, d) => acc + (d.items ?? []).reduce((a, i) => a + (i.cost || 0) * (i.cantidad || i.quantity || 1), 0), 0,
  )
  const costoAdquisicion = costoRetail + costoMayorista

  const margenProductos = ventasNetas - costoAdquisicion

  // Utilidad Real = (Venta Neta – Costo) + Margen Envío – Gastos
  const utilidadReal = margenProductos + margenEnvios - gastosTotal

  return {
    ventasBrutas,
    ventasRetailBrutas,
    ventasMayoristaBrutas,
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
    countMayorista: activeDocs.length,
  }
}