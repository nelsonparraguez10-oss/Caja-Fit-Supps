import { useState, useMemo } from 'react'
import { formatCLP } from '../utils/calculations'

const today = () => new Date().toISOString().split('T')[0]

const SUBTYPES   = ['General', 'Proveedor', 'Envio']
const DOC_TYPES  = ['boleta', 'factura']
const MONTHS     = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const monthLabel = (str) => {
  if (!str) return ''
  const [y, m] = str.split('-')
  return `${MONTHS[parseInt(m) - 1]} ${y}`
}

const calcIvaCredito = (amount, docType) =>
  docType === 'factura' ? amount - amount / 1.19 : 0

// ── Formulario de plantilla (gastos fijos) ────────────────────────────────────
const EMPTY_TPL = { description: '', amount: '', docType: 'boleta', imputDate: today() }

function TemplateForm({ editId, initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY_TPL)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const ivaPreview = form.docType === 'factura' && parseFloat(form.amount) > 0
    ? calcIvaCredito(parseFloat(form.amount), 'factura') : 0

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, amount: parseFloat(form.amount) })
    setForm(EMPTY_TPL)
  }

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <h3>{editId ? 'EDITAR PLANTILLA' : 'NUEVA PLANTILLA FIJA'}</h3>
      <div className="form-row">
        <input type="text"   placeholder="Descripcion"    value={form.description} onChange={(e) => set('description', e.target.value)} required />
        <input type="number" placeholder="Monto mensual"  value={form.amount}      onChange={(e) => set('amount', e.target.value)}      min="0" step="1" required />
        <select value={form.docType} onChange={(e) => set('docType', e.target.value)}>
          {DOC_TYPES.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
        </select>
        {!editId && (
          <input
            type="date"
            value={form.imputDate}
            onChange={(e) => set('imputDate', e.target.value)}
            title="Fecha de imputación para este mes"
          />
        )}
        <button type="submit">{editId ? 'GUARDAR' : 'AGREGAR'}</button>
        {editId && <button type="button" onClick={onCancel}>CANCELAR</button>}
      </div>
      {!editId && (
        <p className="tpl-form-hint">
          La fecha indica cuándo se imputa este gasto en el mes actual.
        </p>
      )}
      {ivaPreview > 0 && (
        <p className="iva-preview">
          IVA Credito Fiscal: {formatCLP(ivaPreview)} &nbsp;|&nbsp; Neto: {formatCLP(parseFloat(form.amount) - ivaPreview)}
        </p>
      )}
    </form>
  )
}

// ── Formulario de gasto variable ──────────────────────────────────────────────
const EMPTY_VAR = { date: today(), description: '', amount: '', subtype: 'General', docType: 'boleta' }

function VariableForm({ editId, initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY_VAR)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const ivaPreview = form.docType === 'factura' && parseFloat(form.amount) > 0
    ? calcIvaCredito(parseFloat(form.amount), 'factura') : 0

  const handleSubmit = (e) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    onSubmit({ ...form, amount, type: 'variable', ivaCredito: calcIvaCredito(amount, form.docType) })
    setForm(EMPTY_VAR)
  }

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <h3>{editId ? 'EDITAR GASTO' : 'NUEVO GASTO VARIABLE'}</h3>
      <div className="form-row">
        <input type="date"   value={form.date}        onChange={(e) => set('date', e.target.value)} required />
        <select value={form.subtype} onChange={(e) => set('subtype', e.target.value)}>
          {SUBTYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="text"   placeholder="Descripcion" value={form.description} onChange={(e) => set('description', e.target.value)} required />
        <input type="number" placeholder="Monto total"  value={form.amount}     onChange={(e) => set('amount', e.target.value)} min="0" step="1" required />
        <select value={form.docType} onChange={(e) => set('docType', e.target.value)}>
          {DOC_TYPES.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
        </select>
        <button type="submit">{editId ? 'GUARDAR' : 'AGREGAR'}</button>
        {editId && <button type="button" onClick={onCancel}>CANCELAR</button>}
      </div>
      {ivaPreview > 0 && (
        <p className="iva-preview">
          IVA Credito Fiscal: {formatCLP(ivaPreview)} &nbsp;|&nbsp; Neto: {formatCLP(parseFloat(form.amount) - ivaPreview)}
        </p>
      )}
    </form>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function Expenses({
  expenses, templates,
  onCreate, onUpdate, onRemove,
  onCreateTemplate, onCreateAndImpute, onUpdateTemplate, onRemoveTemplate,
  onImputeTemplate, onReimputeTemplate,
}) {
  const [tab, setTab]             = useState('fixed')
  const [editVarId, setEditVarId] = useState(null)
  const [editTplId, setEditTplId] = useState(null)
  const [imputeTarget, setImputeTarget] = useState(null) // { id, date, mode: 'new'|'change' }

  const now          = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const varExpenses    = useMemo(() => expenses.filter((e) => e.type === 'variable'), [expenses])
  const fixedAll       = useMemo(() => expenses.filter((e) => e.type === 'fixed')
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')), [expenses])
  const fixedThisMonth = useMemo(() =>
    fixedAll.filter((e) => e.date?.startsWith(currentMonth)),
    [fixedAll, currentMonth],
  )

  const totalFijo    = fixedThisMonth.reduce((a, e) => a + e.amount, 0)
  const totalVar     = varExpenses.reduce((a, e)    => a + e.amount, 0)
  const totalCredito = expenses.reduce((a, e)       => a + (e.ivaCredito || 0), 0)

  return (
    <div className="expenses">
      <h2>Gastos</h2>

      {/* Resumen rápido */}
      <div className="exp-summary">
        <div className="exp-summary__cell">
          <span>Fijos este mes</span>
          <strong>{formatCLP(totalFijo)}</strong>
        </div>
        <div className="exp-summary__cell">
          <span>Variables</span>
          <strong>{formatCLP(totalVar)}</strong>
        </div>
        <div className="exp-summary__cell">
          <span>Credito Fiscal IVA</span>
          <strong className="text-success">{formatCLP(totalCredito)}</strong>
        </div>
        <div className="exp-summary__cell">
          <span>Total</span>
          <strong>{formatCLP(totalFijo + totalVar)}</strong>
        </div>
      </div>

      {/* Pestañas */}
      <div className="exp-tabs">
        <button onClick={() => setTab('fixed')}    className={tab === 'fixed'    ? 'active' : ''}>GASTOS FIJOS</button>
        <button onClick={() => setTab('variable')} className={tab === 'variable' ? 'active' : ''}>GASTOS VARIABLES</button>
      </div>

      {/* ── FIJOS ── */}
      {tab === 'fixed' && (
        <>
          <TemplateForm
            editId={editTplId}
            initial={editTplId ? (() => { const t = templates.find(x => x.id === editTplId); return t ? { description: t.description, amount: String(t.amount), docType: t.docType } : EMPTY_TPL })() : null}
            onSubmit={(data) => {
              if (editTplId) {
                onUpdateTemplate(editTplId, data)
                setEditTplId(null)
              } else {
                const { imputDate, ...tplData } = data
                onCreateAndImpute(tplData, imputDate)
              }
            }}
            onCancel={() => setEditTplId(null)}
          />

          {/* Lista de plantillas */}
          <section className="exp-section">
            <h3 className="exp-section__title">PLANTILLAS CONFIGURADAS</h3>
            {templates.length === 0 ? (
              <p className="empty-msg">Sin plantillas. Agrega una arriba para automatizar gastos mensuales.</p>
            ) : (
              templates.map((t) => {
                const imputado = t.lastImputedMonth === currentMonth
                return (
                  <div key={t.id} className={`tpl-card${imputado ? '' : ' tpl-card--pending'}`}>
                    <div className="tpl-card__left">
                      <span className="tpl-card__name">{t.description}</span>
                      <span className="tpl-card__amount">{formatCLP(t.amount)}</span>
                      <span className={`doc-badge doc-badge--${t.docType}`}>{t.docType.toUpperCase()}</span>
                      {t.docType === 'factura' && (
                        <span className="tpl-card__iva">CF: {formatCLP(calcIvaCredito(t.amount, 'factura'))}</span>
                      )}
                    </div>
                    <div className="tpl-card__right">
                      <span className={`imputation-status${imputado ? ' ok' : ' pending'}`}>
                        {imputado ? `Imputado ${monthLabel(t.lastImputedMonth)}` : 'Pendiente este mes'}
                      </span>

                      {/* Pendiente: botón IMPUTAR con date picker */}
                      {!imputado && imputeTarget?.id !== t.id && (
                        <button onClick={() => setImputeTarget({ id: t.id, date: today(), mode: 'new' })}>IMPUTAR</button>
                      )}

                      {/* Ya imputado: botón CAMBIAR FECHA */}
                      {imputado && imputeTarget?.id !== t.id && (
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            const existing = fixedThisMonth.find((e) => e.templateId === t.id)
                            setImputeTarget({ id: t.id, expenseId: existing?.id, date: existing?.date ?? today(), mode: 'change' })
                          }}
                        >
                          CAMBIAR FECHA
                        </button>
                      )}

                      {/* Date picker inline (IMPUTAR o CAMBIAR FECHA) */}
                      {imputeTarget?.id === t.id && (
                        <div className="impute-date-row">
                          <span className="impute-date-label">
                            {imputeTarget.mode === 'change' ? 'Nueva fecha:' : 'Fecha:'}
                          </span>
                          <input
                            type="date"
                            value={imputeTarget.date}
                            onChange={(e) => setImputeTarget((p) => ({ ...p, date: e.target.value }))}
                          />
                          <button onClick={() => {
                            if (imputeTarget.mode === 'change' && imputeTarget.expenseId) {
                              onReimputeTemplate(imputeTarget.expenseId, imputeTarget.id, imputeTarget.date)
                            } else {
                              onImputeTemplate(imputeTarget.id, imputeTarget.date)
                            }
                            setImputeTarget(null)
                          }}>
                            CONFIRMAR
                          </button>
                          <button onClick={() => setImputeTarget(null)}>CANCELAR</button>
                        </div>
                      )}

                      <button onClick={() => setEditTplId(t.id)}>EDITAR</button>
                      <button className="btn-danger" onClick={() => onRemoveTemplate(t.id)}>ELIMINAR</button>
                    </div>
                  </div>
                )
              })
            )}
          </section>

          {/* Historial completo de gastos fijos */}
          {fixedAll.length > 0 && (
            <section className="exp-section">
              <div className="exp-section__header-row">
                <h3 className="exp-section__title">HISTORIAL DE IMPUTACIONES</h3>
                <span className="exp-section__badge">{fixedThisMonth.length} este mes</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th><th>Descripcion</th><th>Monto</th>
                    <th>Doc.</th><th>IVA Credito</th><th>Origen</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {fixedAll.map((e) => {
                    const esEsteMes = e.date?.startsWith(currentMonth)
                    return (
                      <tr key={e.id} className={esEsteMes ? 'row--current-month' : ''}>
                        <td>{e.date}</td>
                        <td>{e.description}</td>
                        <td>{formatCLP(e.amount)}</td>
                        <td><span className={`doc-badge doc-badge--${e.docType}`}>{e.docType?.toUpperCase() ?? '—'}</span></td>
                        <td>{e.ivaCredito ? formatCLP(e.ivaCredito) : '—'}</td>
                        <td className="text-muted">{e.autoGenerated ? 'Auto' : 'Manual'}</td>
                        <td><button className="btn-danger" onClick={() => onRemove(e.id)}>ELIMINAR</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="exp-section__total">Total fijos este mes: {formatCLP(totalFijo)}</p>
            </section>
          )}
        </>
      )}

      {/* ── VARIABLES ── */}
      {tab === 'variable' && (
        <>
          <VariableForm
            editId={editVarId}
            initial={editVarId ? (() => { const e = varExpenses.find(x => x.id === editVarId); return e ? { date: e.date, description: e.description, amount: String(e.amount), subtype: e.subtype || 'General', docType: e.docType || 'boleta' } : EMPTY_VAR })() : null}
            onSubmit={(data) => {
              if (editVarId) { onUpdate(editVarId, data); setEditVarId(null) }
              else onCreate(data)
            }}
            onCancel={() => setEditVarId(null)}
          />

          {varExpenses.length === 0 ? (
            <p className="empty-msg">Sin gastos variables registrados.</p>
          ) : (
            <section className="exp-section">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th><th>Tipo</th><th>Descripcion</th>
                    <th>Monto</th><th>Doc.</th><th>IVA Credito</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {[...varExpenses].reverse().map((e) => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td><span className={`subtype-badge subtype--${e.subtype?.toLowerCase()}`}>{e.subtype ?? 'General'}</span></td>
                      <td>{e.description}</td>
                      <td>{formatCLP(e.amount)}</td>
                      <td><span className={`doc-badge doc-badge--${e.docType}`}>{e.docType?.toUpperCase() ?? '—'}</span></td>
                      <td>{e.ivaCredito ? formatCLP(e.ivaCredito) : '—'}</td>
                      <td>
                        <button onClick={() => setEditVarId(e.id)}>EDITAR</button>
                        <button className="btn-danger" onClick={() => onRemove(e.id)}>ELIMINAR</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="exp-section__total">Total variables: {formatCLP(totalVar)}</p>
            </section>
          )}
        </>
      )}
    </div>
  )
}