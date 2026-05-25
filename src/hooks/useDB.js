import { useState, useEffect, useCallback } from 'react'
import {
  products as dbProducts, sales as dbSales,
  expenses as dbExpenses, expenseTemplates as dbTemplates,
  clients as dbClients, salesNotes as dbSalesNotes, documents as dbDocuments,
} from '../data/db'

export function useProducts() {
  const [products, setProducts] = useState([])
  const refresh = useCallback(async () => setProducts(await dbProducts.getAll()), [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    products,
    refresh,
    create:  async (p)           => { await dbProducts.create(p);           await refresh() },
    update:  async (bc, updates) => { await dbProducts.update(bc, updates); await refresh() },
    remove:  async (bc)          => { await dbProducts.delete(bc);          await refresh() },
  }
}

export function useSales() {
  const [sales, setSales] = useState([])
  const refresh = useCallback(async () => setSales(await dbSales.getAll()), [])

  useEffect(() => { refresh() }, [refresh])

  return {
    sales,
    refresh,
    create:          async (sale)                   => { const s = await dbSales.create(sale);                       await refresh(); return s },
    remove:          async (id)                     => { await dbSales.delete(id);                                  await refresh() },
    voidSale:        async (id)                     => { await dbSales.voidSale(id);                                await refresh() },
    updateCardBrand: async (id, cardBrand, cardComm) => { await dbSales.updateCardBrand(id, cardBrand, cardComm);  await refresh() },
  }
}

export function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const refresh = useCallback(async () => setExpenses(await dbExpenses.getAll()), [])

  useEffect(() => { refresh() }, [refresh])

  return {
    expenses,
    refresh,
    create: async (e)           => { await dbExpenses.create(e);           await refresh() },
    update: async (id, updates) => { await dbExpenses.update(id, updates); await refresh() },
    remove: async (id)          => { await dbExpenses.delete(id);          await refresh() },
  }
}

export function useExpenseTemplates() {
  const [templates, setTemplates] = useState([])
  const refresh = useCallback(async () => setTemplates(await dbTemplates.getAll()), [])

  useEffect(() => { refresh() }, [refresh])

  return {
    templates,
    refresh,
    create:    async (t)           => { const r = await dbTemplates.create(t); await refresh(); return r },
    update:    async (id, updates) => { await dbTemplates.update(id, updates); await refresh() },
    remove:    async (id)          => { await dbTemplates.delete(id);          await refresh() },
    imputeNow: async (id, date)    => { await dbTemplates.imputeNow(id, date); await refresh() },
  }
}

export function useClients() {
  const [clients, setClients] = useState([])
  const refresh = useCallback(async () => setClients(await dbClients.getAll()), [])

  useEffect(() => { refresh() }, [refresh])

  return {
    clients, refresh,
    create: async (d)      => { await dbClients.create(d);       await refresh() },
    update: async (id, d)  => { await dbClients.update(id, d);   await refresh() },
    remove: async (id)     => { await dbClients.delete(id);      await refresh() },
  }
}

export function useSalesNotes() {
  const [notes, setNotes] = useState([])
  const refresh = useCallback(async () => setNotes(await dbSalesNotes.getAll()), [])

  useEffect(() => { refresh() }, [refresh])

  return {
    notes, refresh,
    create: async (d)      => { const n = await dbSalesNotes.create(d); await refresh(); return n },
    update: async (id, d)  => { await dbSalesNotes.update(id, d);       await refresh() },
    remove: async (id)     => { await dbSalesNotes.delete(id);          await refresh() },
  }
}

export function useDocuments() {
  const [docs, setDocs] = useState([])
  const refresh = useCallback(async () => setDocs(await dbDocuments.getAll()), [])

  useEffect(() => { refresh() }, [refresh])

  return {
    docs, refresh,
    create:  async (d)  => { const doc = await dbDocuments.create(d); await refresh(); return doc },
    remove:  async (id) => { await dbDocuments.delete(id);            await refresh() },
    voidDoc: async (id) => { await dbDocuments.voidDoc(id);           await refresh() },
  }
}