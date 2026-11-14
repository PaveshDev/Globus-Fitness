import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from './AuthContext.js'
import { api } from '../services/api.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setUser((await api('/auth/me')).user) }
    catch (error) {
      if (error.status === 401) setUser(null)
      else setError(error.message)
    } finally { setLoading(false) }
  }, [])
  useEffect(() => {
    let active = true
    api('/auth/me').then((result) => { if (active) setUser(result.user) }).catch((error) => {
      if (active && error.status !== 401) setError(error.message)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }) }
    catch (error) { if (error.status !== 401) throw error }
    setUser(null)
  }
  return <AuthContext.Provider value={{ user, setUser, loading, error, refresh, logout }}>{children}</AuthContext.Provider>
}
