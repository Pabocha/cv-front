import { createContext, useContext, useEffect, useState } from 'react'
import { fetchMe, login, logout, register } from '../../api/auth'
import { clearAccessToken, setAccessToken } from '../../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const handleAuthLogout = () => setUser(null)
    window.addEventListener('auth:logout', handleAuthLogout)

    fetchMe()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setInitializing(false))

    return () => window.removeEventListener('auth:logout', handleAuthLogout)
  }, [])

  const onLogin = async (credentials) => {
    const res = await login(credentials)
    setAccessToken(res.data.access)
    setUser(res.data.user)
    return res.data
  }

  const onRegister = async (data) => {
    const res = await register(data)
    setAccessToken(res.data.access)
    setUser(res.data.user)
    return res.data
  }

  const onLogout = async () => {
    try {
      await logout()
    } catch {
      /* ignore — le token access est déjà invalide */
    }
    clearAccessToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, initializing, login: onLogin, register: onRegister, logout: onLogout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}