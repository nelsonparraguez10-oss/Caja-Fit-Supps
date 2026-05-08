import { useState, useMemo } from 'react'
import { formatCLP } from '../utils/calculations'

const CATEGORIES = ['Snack','Bebestibles','Gel','Proteinas','Creatina','Pre entreno','Aminoácido',
                    'Vitaminas','Quemador','Ganadores','Shaker','Botella','Accesorios','General']

const EMPTY_FORM = {
  barcode: '', name: '', variante: '', marca: '', proveedor: '',
  price: '', cost: '', stock: '', category: 'General', margenPct: '',
}

export function Products({ products, onCreate, onUpdate, onRemove }) {
  const [form, setForm]          = useState(EMPTY_FORM)
  const [editBarcode, setEditBC] = useState(null)
  const [search, setSearch]      = useState('')
  const [catFilter, setCatFilter] = useState('Todos')

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...form,
      price:    parseFloat(form.price)    || 0,
      cost:     parseFloat(form.cost)     || 0,
      stock:    parseInt(form.stock)      || 0,
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
          <input type="number" value={form.price}     onChange={(e) => set('price', e.target.value)}     placeholder="Precio (con IVA)" min="0" step="1" required />
          <input type="number" value={form.cost}      onChange={(e) => set('cost', e.target.value)}      placeholder="Costo neto (sin IVA)" min="0" step="1" required />
          <input type="number" value={form.stock}     onChange={(e) => set('stock', e.target.value)}     placeholder="Stock" min="0" required />
          <input type="number" value={form.margenPct} onChange={(e) => set('margenPct', e.target.value)} placeholder="Margen %" min="0" max="100" />
        </div>
        <div className="form-actions">
          <button type="submit">{editBarcode ? 'Guardar cambios' : 'Agregar producto'}</button>
          {editBarcode && <button type="button" onClick={cancelEdit}>Cancelar</button>}
        </div>
      </form>

      {/* Filtros */}
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
      </div>
      <p className="products__count">{filtered.length} producto(s) — {stockTotal} unidades en stock</p>

      <div className="table-wrap">
        <table className="products-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Variante</th>
              <th>Marca</th>
              <th>Proveedor</th>
              <th>Categ.</th>
              <th>Precio</th>
              <th>Costo</th>
              <th>Margen</th>
              <th>Stock</th>
              <th>Acciones</th>
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
                    <button className="btn-danger" onClick={() => onRemove(p.barcode)}>ELIMINAR</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="empty-msg">Sin resultados.</p>}
      </div>
    </div>
  )
}