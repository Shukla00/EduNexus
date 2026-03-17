import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await authApi.me()
      setUser(data)
    } catch {
      setUser(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) fetchMe()
    else setLoading(false)
  }, [fetchMe])

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      await authApi.logout(refresh)
    } catch {}
    localStorage.clear()
    setUser(null)
  }

  const isAdmin = user?.role === 'ADMIN'
  const isHOD = user?.role === 'HOD'
  const isFaculty = user?.role === 'FACULTY'
  const isStudent = user?.role === 'STUDENT'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchMe, isAdmin, isHOD, isFaculty, isStudent }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
