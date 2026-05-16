import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { formatCLP } from '../utils/calculations'

const CATEGORIES = ['Snack','Bebestibles','Gel','Proteinas','Creatina','Pre entreno','Aminoácido',
                    'Vitaminas','Quemador','Ganadores','Shaker','Botella','Accesorios','General']

const EMPTY_FORM = {
  barcode: '', name: '', variante: '', marca: '', proveedor: '',
  price: '', cost: '', stock: '', category: 'General', margenPct: '',
}

// Margen % = (precio - costo) / costo × 100  →  ganancia sobre la inversión
const autoMargen = (price, cost) => {
  const p = parseFloat(price)
  const c = parseFloat(cost)
  if (!c || c <= 0 || !p || p <= 0) return ''
  return String(Math.round(((p - c) / c) * 100))
}

function exportInventario(products) {
  const rows = products.map((p) => ({
    'Código':            p.barcode,
    'Nombre':            p.name,
    'Variante/Sabor':    p.variante  || '',
    'Marca':             p.marca     || '',
    'Proveedor':         p.proveedor || '',
    'Categoría':         p.category  || '',
    'Precio (c/IVA)':    p.price,
    'Precio Neto':       Math.round(p.price / 1.19),
    'Costo Neto':        p.cost,
    'Margen %':          p.margenPct ? `${p.margenPct}%` : '',
    'Stock':             p.stock,
    'Valor Inventario':  p.stock * p.cost,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 16 }, { wch: 32 }, { wch: 16 }, { wch: 16 },
    { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 10 }, { wch: 8  }, { wch: 16 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
  XLSX.writeFile(wb, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function Products({ products, onCreate, onUpdate, onRemove }) {
  const [form, setForm]           = useState(EMPTY_FORM)
  const [editBarcode, setEditBC]  = useState(null)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('Todos')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const set = (key, val) => setForm((f) => {
    const next = { ...f, [key]: val }
    // Recalcular margen automáticamente al cambiar precio o costo
    if (key === 'price' || key === 'cost') {
      const price = key === 'price' ? val : f.price
      const cost  = key === 'cost'  ? val : f.cost
      next.margenPct = autoMargen(price, cost)
    }
    return next
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...form,
      price:     parseFloat(form.price)   || 0,
      cost:      parseFloat(form.cost)    || 0,
      stock:     parseInt(form.stock)     || 0,
      margenPct: parseInt(form.margenPct) || 0,
    }
    if (editBarcode) { onUpdate(editBarcode, data); setEditBC(null) }
    else onCreate(data)
    setForm(EMPTY_FORM)
  }

  const startEdit = (p) => {
    setEditBC(p.barcode)
    setForm({
      barcode:   p.barcode,
      name:      p.name,
      variante:  p.variante  || '',
      marca:     p.marca     || '',
      proveedor: p.proveedor || '',
      price:     String(p.price),
      cost:      String(p.cost),
      stock:     String(p.stock),
      category:  p.category  || 'General',
      margenPct: String(p.margenPct || ''),
    })
  }

  const cancelEdit = () => { setEditBC(null); setForm(EMPTY_FORM) }

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))].sort()
    return ['Todos', ...cats]
  }, [products])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter((p) => {
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q)      ||
        p.barcode.toLowerCase().includes(q)   ||
        (p.variante  || '').toLowerCase().includes(q) ||
        (p.marca     || '').toLowerCase().includes(q) ||
        (p.proveedor || '').toLowerCase().includes(q)
      const matchCat = catFilter === 'Todos' || p.category === catFilter
      return matchSearch && matchCat
    })
  }, [products, search, catFilter])

  const stockTotal = filtered.reduce((a, p) => a + p.stock, 0)

  return (
    <div className="products">
      <h2>Inventario</h2>

      <form onSubmit={handleSubmit} className="product-form">
        <h3>{editBarcode ? 'Editar producto' : 'Nuevo producto'}</h3>
        <div className="form-grid form-grid--wide">
          <input type="text"   value={form.barcode}   onChange={(e) => set('barcode', e.target.value)}   placeholder="Código de barras" required disabled={!!editBarcode} />
          <input type="text"   value={form.name}      onChange={(e) => set('name', e.target.value)}      placeholder="Nombre" required />
          <input type="text"   value={form.variante}  onChange={(e) => set('variante', e.target.value)}  placeholder="Variante / Sabor" />
          <input type="text"   value={form.marca}     onChange={(e) => set('marca', e.target.value)}     placeholder="Marca" />
          <input type="text"   value={form.proveedor} onChange={(e) => set('proveedor', e.target.value)} placeholder="Proveedor" />
          <select value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="Precio venta (con IVA)" min="0" step="1" required />
          <input type="number" value={form.cost}  onChange={(e) => set('cost',  e.target.value)} placeholder="Costo neto (sin IVA)"   min="0" step="1" required />
          <input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="Stock" min="0" required />
          <div className="margen-field">
            <input
              type="number"
              value={form.margenPct}
              onChange={(e) => set('margenPct', e.target.value)}
              placeholder="Margen % (auto)"
              min="0"
              className="margen-input"
            />
            {form.margenPct !== '' && (
              <span className={`margen-badge ${parseInt(form.margenPct) >= 40 ? 'margen-badge--ok' : parseInt(form.margenPct) < 20 ? 'margen-badge--low' : ''}`}>
                {form.margenPct}% sobre costo
              </span>
            )}
          </div>
        </div>
        <div className="form-actions">
          <button type="submit">{editBarcode ? 'Guardar cambios' : 'Agregar producto'}</button>
          {editBarcode && <button type="button" onClick={cancelEdit}>Cancelar</button>}
        </div>
      </form>

      {/* Filtros + exportar */}
      <div className="products__filters">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar nombre, variante, marca, proveedor, código…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="cat-filter">
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="button" className="btn-export" onClick={() => exportInventario(filtered)} title="Descargar inventario en Excel">
          ↓ Exportar Excel
        </button>
      </div>
      <p className="products__count">{filtered.length} producto(s) — {stockTotal} unidades en stock</p>

      <div className="table-wrap">
        <table className="products-table">
          <thead>
            <tr>
              <th>Código</th><th>Nombre</th><th>Variante</th><th>Marca</th>
              <th>Proveedor</th><th>Categ.</th><th>Precio</th><th>Costo</th>
              <th>Margen</th><th>Stock</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const lowStock = p.stock <= 5
              return (
                <tr key={p.barcode} className={lowStock ? 'row--low-stock' : ''}>
                  <td className="td-code">{p.barcode}</td>
                  <td>{p.name}</td>
                  <td className="text-muted">{p.variante || '—'}</td>
                  <td>{p.marca || '—'}</td>
                  <td className="text-muted">{p.proveedor || '—'}</td>
                  <td><span className="cat-badge">{p.category}</span></td>
                  <td>{formatCLP(p.price)}</td>
                  <td>{formatCLP(p.cost)}</td>
                  <td className={p.margenPct >= 40 ? 'text-success' : p.margenPct < 25 ? 'text-warn' : ''}>
                    {p.margenPct ? `${p.margenPct}%` : '—'}
                  </td>
                  <td className={lowStock ? 'text-warn' : ''}>{p.stock}{lowStock ? ' ⚠' : ''}</td>
                  <td>
                    <button onClick={() => startEdit(p)}>EDITAR</button>
                    <button className="btn-danger" onClick={() => setDeleteTarget(p)}>ELIMINAR</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="empty-msg">Sin resultados.</p>}
      </div>

      {deleteTarget && (
        <div className="void-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="void-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="void-modal__title">Eliminar producto</h3>
            <p className="void-modal__body">
              ¿Estás seguro que deseas eliminar{' '}
              <strong>{deleteTarget.name}{deleteTarget.variante ? ` — ${deleteTarget.variante}` : ''}</strong>?
              <br />Esta acción no puede deshacerse y el producto desaparecerá del inventario.
            </p>
            <div className="void-modal__actions">
              <button className="void-modal__cancel" onClick={() => setDeleteTarget(null)}>CANCELAR</button>
              <button className="void-modal__confirm" onClick={() => { onRemove(deleteTarget.barcode); setDeleteTarget(null) }}>
                CONFIRMAR ELIMINACIÓN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}