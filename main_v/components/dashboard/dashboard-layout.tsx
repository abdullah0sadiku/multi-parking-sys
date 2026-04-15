"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { TopNavbar } from "./top-navbar"
import { useAuth } from "@/store/authStore"
import type { UserRole } from "@/types"

interface DashboardLayoutProps {
  children: React.ReactNode
  /** Roles allowed to access this page. Defaults to admin + staff. */
  requiredRoles?: UserRole[]
}

export function DashboardLayout({
  children,
  requiredRoles = ["admin", "staff"],
}: DashboardLayoutProps) {
  const [isDark, setIsDark] = useState(true)
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    // Customer tried to access the admin dashboard → send them to their portal
    if (user?.role === "customer") {
      router.replace("/register/dashboard")
      return
    }

    // Staff tried to access an admin-only page
    if (user && !requiredRoles.includes(user.role)) {
      router.replace("/administration")
    }
  }, [isAuthenticated, isLoading, user, requiredRoles, router])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme === "dark" || (!savedTheme && systemDark)) {
      setIsDark(true)
      document.documentElement.classList.add("dark")
    } else {
      setIsDark(false)
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    if (isDark) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    }
  }

  // Show spinner while resolving auth state or during a redirect
  const isAllowed =
    isAuthenticated &&
    user?.role !== "customer" &&
    requiredRoles.includes(user?.role as UserRole)

  if (isLoading || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <TopNavbar isDark={isDark} onToggleTheme={toggleTheme} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
