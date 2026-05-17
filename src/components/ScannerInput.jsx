import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { calcNeto, calcIVA, formatCLP } from '../utils/calculations'

// Keystroke interval below this = scanner gun (ms between keystrokes)
const SCANNER_SPEED_MS = 40

export function ScannerInput({ onScan, queryMode, onToggleQueryMode, products }) {
  const inputRef        = useRef(null)
  const lastKeyTimeRef  = useRef(0)
  const scannerModeRef  = useRef(false) // true while receiving fast bursts

  const [value,       setValue]       = useState('')
  const [highlighted, setHighlighted] = useState(-1)
  const [queryResult, setQueryResult] = useState(null)
  const [message,     setMessage]     = useState(null)

  const onScanRef    = useRef(onScan)
  onScanRef.current  = onScan
  const queryModeRef = useRef(queryMode)
  queryModeRef.current = queryMode

  /* ── product lookup ── */
  const allProducts = useMemo(() => products ?? [], [products])

  const exactMatch = useMemo(() => {
    const v = value.trim()
    if (!v) return null
    return allProducts.find((p) => p.barcode === v) ?? null
  }, [value, allProducts])

  const suggestions = useMemo(() => {
    const v = value.trim().toLowerCase()
    if (!v || exactMatch) return []
    return allProducts.filter((p) =>
      (p.barcode ?? '').toLowerCase().includes(v) ||
      (p.name ?? '').toLowerCase().includes(v) ||
      (p.marca || '').toLowerCase().includes(v)
    ).slice(0, 8)
  }, [value, exactMatch, allProducts])

  /* ── flash message ── */
  const flash = useCallback((text, type = 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 2500)
  }, [])

  /* ── add product to cart or show query ── */
  const commitProduct = useCallback((product) => {
    if (queryModeRef.current) {
      setQueryResult({ product, neto: calcNeto(product.price), iva: calcIVA(product.price) })
    } else {
      const result = onScanRef.current(product.barcode)
      if (result?.error) flash(result.error)
      else flash(`Agregado: ${product.name}`, 'success')
    }
    setValue('')
    setHighlighted(-1)
    scannerModeRef.current = false
    // Immediate refocus for next scan / keystroke
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [flash])

  /* ── submit by barcode string ── */
  const submitBarcode = useCallback((code) => {
    const p = allProducts.find((x) => x.barcode === code.trim())
    if (!p) { flash(`Producto no encontrado: ${code}`); return }
    commitProduct(p)
  }, [allProducts, commitProduct, flash])

  /* ── focus on mount ── */
  useEffect(() => { inputRef.current?.focus() }, [])

  /* ── leaving query mode: clear result + refocus ── */
  useEffect(() => {
    if (!queryMode) {
      setQueryResult(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [queryMode])

  /* ── global key redirect: any printable key outside of inputs steers here ── */
  useEffect(() => {
    const INTERACTIVE = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
    const handler = (e) => {
      if (e.key === 'F2') { e.preventDefault(); onToggleQueryMode(); return }
      if (e.target === inputRef.current) return
      if (INTERACTIVE.has(e.target.tagName)) return
      if (e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key.length === 1) {
        e.preventDefault()
        setValue((v) => v + e.key)
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onToggleQueryMode])

  /* ── keyboard handler on the input ── */
  const handleKeyDown = (e) => {
    // Track keystroke speed to detect scanner gun
    const now   = Date.now()
    const delta = now - lastKeyTimeRef.current
    lastKeyTimeRef.current = now
    if (e.key.length === 1 && delta < SCANNER_SPEED_MS) scannerModeRef.current = true

    if (e.key === 'F2') { e.preventDefault(); onToggleQueryMode(); return }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, -1))
      return
    }
    if (e.key === 'Escape') {
      setValue('')
      setHighlighted(-1)
      scannerModeRef.current = false
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      // Highlighted dropdown item wins
      if (highlighted >= 0 && suggestions[highlighted]) {
        commitProduct(suggestions[highlighted])
        return
      }
      // Exact barcode match (scanner or fast typer)
      if (exactMatch) {
        commitProduct(exactMatch)
        return
      }
      // Fallback: try raw value as barcode
      const v = value.trim()
      if (v) submitBarcode(v)
    }
  }

  const handleChange = (e) => {
    setValue(e.target.value)
    setHighlighted(-1)
    if (!e.target.value) scannerModeRef.current = false
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').trim()
    if (!text) return
    const p = allProducts.find((x) => x.barcode === text)
    if (p) commitProduct(p)
    else setValue(text)
  }

  const showDropdown = value.trim().length > 0 && !exactMatch && suggestions.length > 0

  return (
    <div className="scanner-wrap">
      <div className="scanner-row">
        <div className="scanner-suggest-wrap">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={queryMode
              ? 'MODO CONSULTA — escanea o ingresa codigo'
              : 'Escanea o busca por nombre / codigo…'}
            className={`scanner-input${queryMode ? ' scanner-input--query' : ''}`}
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />

          {showDropdown && (
            <ul className="scanner-dropdown">
              {suggestions.map((p, i) => (
                <li
                  key={p.barcode}
                  className={`scanner-dropdown__item${i === highlighted ? ' scanner-dropdown__item--hl' : ''}`}
                  onMouseDown={() => commitProduct(p)}
                >
                  <span className="sdi-name">
                    {p.name}{p.variante ? ` — ${p.variante}` : ''}
                  </span>
                  <span className="sdi-meta">
                    {p.marca}{p.marca ? ' · ' : ''}{formatCLP(p.price)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={onToggleQueryMode}
          className={`btn-consulta${queryMode ? ' btn-consulta--active' : ''}`}
          tabIndex={-1}
        >
          CONSULTA (F2)
        </button>
      </div>

      {message && (
        <p className={`scanner-msg scanner-msg--${message.type}`}>{message.text}</p>
      )}

      {queryMode && queryResult && (
        <div className="query-panel">
          <div className="query-panel__header">
            <h4 className="query-panel__name">{queryResult.product.name}</h4>
            <button className="query-panel__close" onClick={() => setQueryResult(null)} tabIndex={-1}>
              CERRAR
            </button>
          </div>
          <ul className="query-prices">
            <li><span>Precio Neto</span><span>{formatCLP(queryResult.neto)}</span></li>
            <li><span>IVA 19%</span><span>{formatCLP(queryResult.iva)}</span></li>
            <li className="query-prices__total">
              <span>Precio Total</span>
              <span>{formatCLP(queryResult.product.price)}</span>
            </li>
          </ul>
          <p className="query-stock">Stock: <strong>{queryResult.product.stock}</strong> unidades</p>
        </div>
      )}
    </div>
  )
}
