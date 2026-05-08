import { useState } from 'react'
import logo from '../assets/logo-sidebar.png'

// SHA-256 of "email:password:VITE_SECRET_KEY" — credentials never stored in plain text
const AUTH_HASH = 'a6e0a559996c23b6509aabe6e3462443a9fb07a7ccfdb6ad895ecb41df306f1d'

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function verifyCredentials(email, pw) {
  const key  = import.meta.env.VITE_SECRET_KEY ?? ''
  const hash = await sha256(`${email.trim().toLowerCase()}:${pw}:${key}`)
  return hash === AUTH_HASH
}

export function Login({ onSuccess }) {
  const [email, setEmail]     = useState('')
  const [pw, setPw]           = useState('')
  const [error, setError]     = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const ok = await verifyCredentials(email, pw)
    if (ok) {
      onSuccess()
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <img src={logo} alt="Fit Supps" className="login-logo" />
        <p className="login-subtitle">Sistema de Caja</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="login-label">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(false) }}
              placeholder="correo@ejemplo.com"
              className={`login-input${error ? ' login-input--error' : ''}`}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label className="login-label">Contraseña</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(false) }}
              placeholder="••••••••"
              className={`login-input${error ? ' login-input--error' : ''}`}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">Correo o contraseña incorrectos</p>}

          <button type="submit" className="login-btn" disabled={loading || !email || !pw}>
            {loading ? 'Verificando…' : 'INGRESAR'}
          </button>
        </form>

        <p className="login-footer">Fit Supps SpA. · v3.1.0</p>
      </div>
    </div>
  )
}