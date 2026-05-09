// Persistencia sobre localStorage — intercambiable por SQLite
import { PRODUCT_SEED } from './productSeed'

const KEYS = {
  PRODUCTS:           'pos_products',
  SALES:              'pos_sales',
  EXPENSES:           'pos_expenses',
  EXPENSE_TEMPLATES:  'pos_expense_templates',
  CLIENTS:            'pos_clients',
  SALES_NOTES:        'pos_sales_notes',
  DOCUMENTS:          'pos_documents',
}

const uid   = () => Date.now().toString(36) + Math.random().toString(36).slice(2)
const read  = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }
const write = (key, data) => localStorage.setItem(key, JSON.stringify(data))

const nowMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Helper interno: crea una transacción de gasto en localStorage
const _pushExpense = (expense) => {
  const item = { ...expense, id: uid(), createdAt: new Date().toISOString() }
  write(KEYS.EXPENSES, [...read(KEYS.EXPENSES), item])
  return item
}

// ── Products ──────────────────────────────────────────────────────────────────
export const products = {
  getAll:          ()             => read(KEYS.PRODUCTS),
  findByBarcode:   (barcode)      => read(KEYS.PRODUCTS).find((p) => p.barcode === barcode),

  create: (product) => {
    const item = { ...product, id: uid(), createdAt: new Date().toISOString() }
    write(KEYS.PRODUCTS, [...read(KEYS.PRODUCTS), item])
    return item
  },

  update: (barcode, updates) => {
    const next = read(KEYS.PRODUCTS).map((p) => (p.barcode === barcode ? { ...p, ...updates } : p))
    write(KEYS.PRODUCTS, next)
    return next.find((p) => p.barcode === barcode)
  },

  delete: (barcode) => write(KEYS.PRODUCTS, read(KEYS.PRODUCTS).filter((p) => p.barcode !== barcode)),

  decrementStock: (barcode, qty) => {
    write(
      KEYS.PRODUCTS,
      read(KEYS.PRODUCTS).map((p) =>
        p.barcode === barcode ? { ...p, stock: Math.max(0, p.stock - qty) } : p,
      ),
    )
  },

  seed: () => {
    const existing = read(KEYS.PRODUCTS)
    // Reseed if empty or if the stored products are the old sample data (no proveedor field)
    if (existing.length > 0 && existing[0].proveedor !== undefined) return
    write(KEYS.PRODUCTS, [])
    PRODUCT_SEED.forEach((p) => products.create(p))
  },
}

// ── Sales ─────────────────────────────────────────────────────────────────────
export const sales = {
  getAll: () => read(KEYS.SALES),

  create: (sale) => {
    const effectiveTotal = sale.effectiveTotal ?? sale.listTotal ?? sale.total ?? 0
    const item = { ...sale, id: uid(), date: new Date().toISOString(), effectiveTotal, total: effectiveTotal }
    write(KEYS.SALES, [...read(KEYS.SALES), item])
    sale.items.forEach((i) => products.decrementStock(i.barcode, i.quantity))
    return item
  },

  delete: (id) => write(KEYS.SALES, read(KEYS.SALES).filter((s) => s.id !== id)),

  voidSale: (id) => {
    const allSales = read(KEYS.SALES)
    const sale = allSales.find((s) => s.id === id)
    if (!sale || sale.status === 'VOIDED') return null
    // Devolver stock al inventario
    write(
      KEYS.PRODUCTS,
      read(KEYS.PRODUCTS).map((p) => {
        const item = sale.items.find((i) => i.barcode === p.barcode)
        return item ? { ...p, stock: p.stock + item.quantity } : p
      }),
    )
    // Marcar como anulada
    write(
      KEYS.SALES,
      allSales.map((s) => s.id === id ? { ...s, status: 'VOIDED', voidedAt: new Date().toISOString() } : s),
    )
  },
}

// ── Expenses (transacciones reales) ───────────────────────────────────────────
export const expenses = {
  getAll:  ()            => read(KEYS.EXPENSES),
  create:  (expense)     => _pushExpense(expense),

  update: (id, updates) => {
    const next = read(KEYS.EXPENSES).map((e) => (e.id === id ? { ...e, ...updates } : e))
    write(KEYS.EXPENSES, next)
    return next.find((e) => e.id === id)
  },

  delete: (id) => write(KEYS.EXPENSES, read(KEYS.EXPENSES).filter((e) => e.id !== id)),
}

// ── Expense Templates (gastos fijos recurrentes) ──────────────────────────────
export const expenseTemplates = {
  getAll: () => read(KEYS.EXPENSE_TEMPLATES),

  create: (template) => {
    const item = {
      ...template,
      id: uid(),
      isTemplate: true,
      active: true,
      lastImputedMonth: null,
      createdAt: new Date().toISOString(),
    }
    write(KEYS.EXPENSE_TEMPLATES, [...read(KEYS.EXPENSE_TEMPLATES), item])
    return item
  },

  update: (id, updates) => {
    const next = read(KEYS.EXPENSE_TEMPLATES).map((t) => (t.id === id ? { ...t, ...updates } : t))
    write(KEYS.EXPENSE_TEMPLATES, next)
    return next.find((t) => t.id === id)
  },

  delete: (id) => write(KEYS.EXPENSE_TEMPLATES, read(KEYS.EXPENSE_TEMPLATES).filter((t) => t.id !== id)),

  // Imputar una plantilla manualmente ahora
  imputeNow: (templateId) => {
    const template = read(KEYS.EXPENSE_TEMPLATES).find((t) => t.id === templateId)
    if (!template) return null

    const month = nowMonth()
    const today = new Date().toISOString().split('T')[0]
    const ivaCredito = template.docType === 'factura'
      ? template.amount - template.amount / 1.19 : 0

    const tx = _pushExpense({
      ...template,
      id: uid(),
      isTemplate: false,
      templateId:    template.id,
      date:          today,
      autoGenerated: false,
      ivaCredito,
    })

    // Actualizar lastImputedMonth de la plantilla
    write(
      KEYS.EXPENSE_TEMPLATES,
      read(KEYS.EXPENSE_TEMPLATES).map((t) =>
        t.id === templateId ? { ...t, lastImputedMonth: month } : t,
      ),
    )

    return tx
  },

  // Auto-imputar plantillas activas que no se han registrado este mes
  autoImputeMonth: () => {
    const month = nowMonth()
    const templates = read(KEYS.EXPENSE_TEMPLATES).filter((t) => t.active !== false)
    const imputados = []

    templates.forEach((template) => {
      if (template.lastImputedMonth === month) return // ya imputado

      const ivaCredito = template.docType === 'factura'
        ? template.amount - template.amount / 1.19 : 0

      _pushExpense({
        ...template,
        id: uid(),
        isTemplate:    false,
        templateId:    template.id,
        date:          `${month}-01`,
        autoGenerated: true,
        ivaCredito,
      })

      // Marcar como imputado (re-leer para evitar sobreescrituras)
      write(
        KEYS.EXPENSE_TEMPLATES,
        read(KEYS.EXPENSE_TEMPLATES).map((t) =>
          t.id === template.id ? { ...t, lastImputedMonth: month } : t,
        ),
      )

      imputados.push(template.description)
    })

    return imputados
  },
}

// ── Clients (B2B) ─────────────────────────────────────────────────────────────
export const clients = {
  getAll: () => read(KEYS.CLIENTS),

  create: (client) => {
    const item = { ...client, id: uid(), createdAt: new Date().toISOString() }
    write(KEYS.CLIENTS, [...read(KEYS.CLIENTS), item])
    return item
  },

  update: (id, updates) => {
    const next = read(KEYS.CLIENTS).map((c) => c.id === id ? { ...c, ...updates } : c)
    write(KEYS.CLIENTS, next)
    return next.find((c) => c.id === id)
  },

  delete: (id) => write(KEYS.CLIENTS, read(KEYS.CLIENTS).filter((c) => c.id !== id)),
}

// ── Sales Notes (Notas de Venta B2B) ─────────────────────────────────────────
export const salesNotes = {
  getAll: () => read(KEYS.SALES_NOTES),

  create: (note) => {
    const all = read(KEYS.SALES_NOTES)
    const item = {
      ...note,
      id:        uid(),
      folio:     all.length + 1,
      date:      new Date().toISOString().split('T')[0],
      estado:    note.estado || 'pendiente',
      createdAt: new Date().toISOString(),
    }
    write(KEYS.SALES_NOTES, [...all, item])
    return item
  },

  update: (id, updates) => {
    const next = read(KEYS.SALES_NOTES).map((n) => n.id === id ? { ...n, ...updates } : n)
    write(KEYS.SALES_NOTES, next)
    return next.find((n) => n.id === id)
  },

  delete: (id) => write(KEYS.SALES_NOTES, read(KEYS.SALES_NOTES).filter((n) => n.id !== id)),
}

// ── Documents (Facturas / Boletas emitidas SII) ───────────────────────────────
export const documents = {
  getAll: () => read(KEYS.DOCUMENTS),

  create: (doc) => {
    const all = read(KEYS.DOCUMENTS)
    const folio = all.filter((d) => d.tipoDocumento === doc.tipoDocumento).length + 1
    const item = {
      ...doc,
      id:           uid(),
      folio,
      fechaEmision: doc.fechaEmision || new Date().toISOString().split('T')[0],
      estado:       'emitida',
      createdAt:    new Date().toISOString(),
    }
    write(KEYS.DOCUMENTS, [...all, item])
    return item
  },

  delete: (id) => write(KEYS.DOCUMENTS, read(KEYS.DOCUMENTS).filter((d) => d.id !== id)),
}