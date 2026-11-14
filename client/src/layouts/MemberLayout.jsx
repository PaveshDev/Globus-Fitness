import { useState } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router'
import { useAuth } from '../context/AuthContext.js'

export default function MemberLayout({ admin = false }) {
  const { user, loading, error, refresh, logout } = useAuth()
  const [busy, setBusy] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  if (loading) return <section className="container account-page" role="status">Loading your account…</section>
  if (error) return <section className="container account-page"><p role="alert">{error}</p><button className="button button-outline" onClick={refresh}>Try again</button></section>
  if (!user) return <Navigate to="/login" replace />
  if (admin && user.role !== 'ADMIN') return <Navigate to="/member" replace />
  async function signOut() {
    setBusy(true)
    setLogoutError('')
    try { await logout() } catch (error) { setLogoutError(error.message) }
    finally { setBusy(false) }
  }
  return (
    <section className="container account-page">
      <div className="account-heading"><div><p className="eyebrow">GLOBUS FITNESS • MEMBER AREA</p><p className="account-name">{user.name}</p></div><button className="button button-outline button-small" disabled={busy} onClick={signOut}>{busy ? 'Signing out…' : 'Log out'}</button></div>
      <nav className="account-nav" aria-label="Account navigation">
        <NavLink to="/member" end>My profile</NavLink><NavLink to="/member/payments">Payments</NavLink>
        {user.role === 'ADMIN' && <NavLink to="/admin">Administration</NavLink>}
      </nav>
      {logoutError && <p role="alert" className="form-status error">{logoutError}</p>}
      <Outlet />
    </section>
  )
}
