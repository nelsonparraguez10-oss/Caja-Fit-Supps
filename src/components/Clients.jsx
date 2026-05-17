import { useState, useMemo } from 'react'
import { formatRUT, validateRUT } from '../utils/rut'

const EMPTY = { razonSocial: '', rut: '', giro: '', direccion: '', comuna: '', contacto: '', telefono: '', mail: '' }

export function Clients({ clients, onCreate, onUpdate, onRemove }) {
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState(null)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleRUT = (v) => set('rut', formatRUT(v))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editId) { onUpdate(editId, form); setEditId(null) }
    else onCreate(form)
    setForm(EMPTY)
    setShowForm(false)
  }

  const startEdit = (c) => {
    setEditId(c.id)
    setForm({ razonSocial: c.razonSocial, rut: c.rut, giro: c.giro || '', direccion: c.direccion || '', comuna: c.comuna || '', contacto: c.contacto || '', telefono: c.telefono || '', mail: c.mail || '' })
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  const cancel = () => { setEditId(null); setForm(EMPTY); setShowForm(false) }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clients.filter((c) =>
      !q || c.razonSocial.toLowerCase().includes(q) || c.rut.includes(q) ||
      (c.contacto || '').toLowerCase().includes(q) || (c.mail || '').toLowerCase().includes(q)
    )
  }, [clients, search])

  const rutValid = form.rut.length > 2 ? validateRUT(form.rut) : null

  return (
    <div className="clients">
      <div className="module-header">
        <div>
          <h2>Clientes</h2>
          <p className="module-sub">{clients.length} cliente(s) registrado(s)</p>
        </div>
        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)}>NUEVO CLIENTE</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="product-form">
          <h3>{editId ? 'EDITAR CLIENTE' : 'NUEVO CLIENTE'}</h3>
          <div className="form-grid form-grid--wide">
            <input
              type="text" placeholder="Razón Social *" value={form.razonSocial}
              onChange={(e) => set('razonSocial', e.target.value)} required
            />
            <div className="rut-wrap">
              <input
                type="text" placeholder="RUT *" value={form.rut}
                onChange={(e) => handleRUT(e.target.value)} required
                className={rutValid === false ? 'input--error' : rutValid === true ? 'input--ok' : ''}
              />
              {rutValid === false && <span className="rut-hint">RUT inválido</span>}
            </div>
            <input type="text"  placeholder="Giro"       value={form.giro}      onChange={(e) => set('giro', e.target.value)} />
            <input type="text"  placeholder="Dirección"  value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
            <input type="text"  placeholder="Comuna"     value={form.comuna}    onChange={(e) => set('comuna', e.target.value)} />
            <input type="text"  placeholder="Contacto"   value={form.contacto}  onChange={(e) => set('contacto', e.target.value)} />
            <input type="tel"   placeholder="Teléfono"   value={form.telefono}  onChange={(e) => set('telefono', e.target.value)} />
            <input type="email" placeholder="Email"      value={form.mail}      onChange={(e) => set('mail', e.target.value)} />
          </div>
          <div className="form-actions">
            <button type="submit">{editId ? 'GUARDAR CAMBIOS' : 'AGREGAR CLIENTE'}</button>
            <button type="button" onClick={cancel}>CANCELAR</button>
          </div>
        </form>
      )}

      <input
        type="text" className="search-input"
        placeholder="Buscar por razón social, RUT, contacto o email…"
        value={search} onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p className="empty-msg">{clients.length === 0 ? 'Sin clientes registrados.' : 'Sin resultados.'}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Razón Social</th><th>RUT</th><th>Giro</th>
                <th>Dirección</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.razonSocial}</strong></td>
                  <td className="td-code">{c.rut}</td>
                  <td className="text-muted">{c.giro || '—'}</td>
                  <td className="text-muted">{c.direccion ? `${c.direccion}${c.comuna ? ', ' + c.comuna : ''}` : '—'}</td>
                  <td>{c.contacto || '—'}</td>
                  <td>{c.telefono || '—'}</td>
                  <td>{c.mail || '—'}</td>
                  <td>
                    <div className="action-btns">
                      {confirmId === c.id ? (
                        <>
                          <span className="confirm-label">¿Eliminar?</span>
                          <button type="button" className="btn-danger" onClick={() => { onRemove(c.id); setConfirmId(null) }}>SÍ</button>
                          <button type="button" onClick={() => setConfirmId(null)}>NO</button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => startEdit(c)}>EDITAR</button>
                          <button type="button" className="btn-danger" onClick={() => setConfirmId(c.id)}>ELIMINAR</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
