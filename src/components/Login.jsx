import { useState } from 'react'
import logo from '../assets/logo-sidebar.png'

const VALID_EMAIL = 'fitsupps2025@gmail.com'
const VALID_PW    = '8997'

export function Login({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [pw, setPw]       = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (email.trim().toLowerCase() === VALID_EMAIL && pw === VALID_PW) {
        onSuccess()
      } else {
        setError(true)
        setLoading(false)
      }
    }, 400)
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

          {error && (
            <p className="login-error">Correo o contraseña incorrectos</p>
          )}

          <button type="submit" className="login-btn" disabled={loading || !email || !pw}>
            {loading ? 'Verificando…' : 'INGRESAR'}
          </button>
        </form>

        <p className="login-footer">Fit Supps SpA. · v3.1.0</p>
      </div>
    </div>
  )
}