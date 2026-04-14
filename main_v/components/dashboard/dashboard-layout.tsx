"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { TopNavbar } from "./top-navbar"
import { useAuth } from "@/store/authStore"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isDark, setIsDark] = useState(true)
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Auth guard — redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    // Check for saved preference or system preference
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

  // While rehydrating from localStorage — show nothing to avoid flash
  if (isLoading || !isAuthenticated) {
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
