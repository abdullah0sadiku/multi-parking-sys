"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { AuthResponse, User, UserRole } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (authData: AuthResponse) => void
  logout: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Rehydrate from localStorage on mount (client only)
  useEffect(() => {
    const storedToken = localStorage.getItem("parking_token")
    const storedUser = localStorage.getItem("parking_user")
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("parking_token")
        localStorage.removeItem("parking_user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((authData: AuthResponse) => {
    const userObj: User = {
      id: authData.user.id,
      email: authData.user.email,
      role: authData.user.role as UserRole,
      created_at: "",
      updated_at: "",
    }
    localStorage.setItem("parking_token", authData.token)
    localStorage.setItem("parking_user", JSON.stringify(userObj))
    setToken(authData.token)
    setUser(userObj)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("parking_token")
    localStorage.removeItem("parking_user")
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, isAuthenticated: !!token, isLoading, login, logout }),
    [user, token, isLoading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
