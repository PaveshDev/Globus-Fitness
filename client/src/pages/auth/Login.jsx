import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { api } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.js'

export default function Login() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await api('/auth/login', { method: 'POST', body: { phone, password } })
      setUser(result.user)
      navigate('/member', { replace: true })
    } catch (error) { setError(error.message) }
    finally { setBusy(false) }
  }
  if (user) return <Navigate to="/member" replace />
  return (
    <section className="container auth-page">
      <div className="auth-shell">
        <div className="auth-copy"><p className="eyebrow">MEMBER LOGIN</p><h1>Welcome back</h1><p>Access your member profile, make a payment, and keep track of your payment history.</p></div>
        <form className="auth-form" onSubmit={submit}>
          <div className="field-group"><label htmlFor="login-phone">Phone number</label><input id="login-phone" type="tel" autoComplete="username" placeholder="0771234567" required maxLength={25} value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
          <div className="field-group"><label htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          {error && <p className="form-status error" role="alert">{error}</p>}
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
          <p className="auth-footer">New to Globus? <Link to="/register">Create an account</Link></p>
        </form>
      </div>
    </section>
  )
}

