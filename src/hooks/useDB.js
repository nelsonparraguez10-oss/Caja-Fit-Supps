import { useState, useEffect, useCallback } from 'react'
import {
  products as dbProducts, sales as dbSales,
  expenses as dbExpenses, expenseTemplates as dbTemplates,
  clients as dbClients, salesNotes as dbSalesNotes, documents as dbDocuments,
} from '../data/db'

export function useProducts() {
  const [products, setProducts] = useState([])
  const refresh = useCallback(() => setProducts(dbProducts.getAll()), [])

  useEffect(() => {
    dbProducts.seed()
    refresh()
  }, [refresh])

  return {
    products,
    refresh,
    create:  (p)           => { dbProducts.create(p);            refresh() },
    update:  (bc, updates) => { dbProducts.update(bc, updates);  refresh() },
    remove:  (bc)          => { dbProducts.delete(bc);           refresh() },
  }
}

export function useSales() {
  const [sales, setSales] = useState([])
  const refresh = useCallback(() => setSales(dbSales.getAll()), [])

  useEffect(() => { refresh() }, [refresh])

  return {
    sales,
    refresh,
    create: (sale) => { const s = dbSales.create(sale); refresh(); return s },
    remove: (id)   => { dbSales.delete(id); refresh() },
  }
}

export function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const refresh = useCallback(() => setExpenses(dbExpenses.getAll()), [])

  useEffect(() => { refresh() }, [refresh])

  return {
    expenses,
    refresh,
    create: (e)            => { dbExpenses.create(e);            refresh() },
    update: (id, updates)  => { dbExpenses.update(id, updates);  refresh() },
    remove: (id)           => { dbExpenses.delete(id);           refresh() },
  }
}

export function useExpenseTemplates() {
  const [templates, setTemplates] = useState([])
  const refresh = useCallback(() => setTemplates(dbTemplates.getAll()), [])

  useEffect(() => { refresh() }, [refresh])

  return {
    templates,
    refresh,
    create:    (t)           => { dbTemplates.create(t);           refresh() },
    update:    (id, updates) => { dbTemplates.update(id, updates); refresh() },
    remove:    (id)          => { dbTemplates.delete(id);          refresh() },
    imputeNow: (id)          => { dbTemplates.imputeNow(id);       refresh() },
  }
}

export function useClients() {
  const [clients, setClients] = useState([])
  const refresh = useCallback(() => setClients(dbClients.getAll()), [])
  useEffect(() => { refresh() }, [refresh])
  return {
    clients, refresh,
    create: (d)      => { dbClients.create(d);         refresh() },
    update: (id, d)  => { dbClients.update(id, d);     refresh() },
    remove: (id)     => { dbClients.delete(id);         refresh() },
  }
}

export function useSalesNotes() {
  const [notes, setNotes] = useState([])
  const refresh = useCallback(() => setNotes(dbSalesNotes.getAll()), [])
  useEffect(() => { refresh() }, [refresh])
  return {
    notes, refresh,
    create: (d)      => { const n = dbSalesNotes.create(d); refresh(); return n },
    update: (id, d)  => { dbSalesNotes.update(id, d);       refresh() },
    remove: (id)     => { dbSalesNotes.delete(id);           refresh() },
  }
}

export function useDocuments() {
  const [docs, setDocs] = useState([])
  const refresh = useCallback(() => setDocs(dbDocuments.getAll()), [])
  useEffect(() => { refresh() }, [refresh])
  return {
    docs, refresh,
    create: (d)  => { const doc = dbDocuments.create(d); refresh(); return doc },
    remove: (id) => { dbDocuments.delete(id); refresh() },
  }
}