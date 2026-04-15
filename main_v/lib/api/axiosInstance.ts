import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
})

// ─── Request interceptor: attach JWT ──────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("parking_token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response interceptor: handle 401 → redirect to login ────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const raw = localStorage.getItem("parking_user")
      let role: string | null = null
      try { role = raw ? JSON.parse(raw)?.role : null } catch { /* ignore */ }
      localStorage.removeItem("parking_token")
      localStorage.removeItem("parking_user")
      window.location.href = role === "customer" ? "/register" : "/login"
    }
    return Promise.reject(error)
  }
)

// ─── Helper: extract error message from API response ─────────────────────────
// Backend shape: { success: false, error: { code: string, message: string } }
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as {
      message?: string
      error?: string | { code?: string; message?: string; details?: unknown }
    } | undefined

    // Top-level message (rare)
    if (typeof data?.message === "string" && data.message) return data.message

    // Nested error object — our standard backend format
    const apiErr = data?.error
    if (typeof apiErr === "string" && apiErr) return apiErr
    if (apiErr && typeof apiErr === "object" && typeof apiErr.message === "string")
      return apiErr.message

    // Axios network-level message
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return "An unexpected error occurred"
}
