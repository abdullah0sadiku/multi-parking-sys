"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ParkingSquare,
  Car,
  Users,
  Timer,
  CreditCard,
  Receipt,
  Wallet,
  DollarSign,
  ShieldAlert,
  AlertTriangle,
  UserCog,
  ChevronLeft,
  ChevronRight,
  ParkingCircle,
} from "lucide-react"
import { useState } from "react"

const navigation = [
  { name: "Dashboard",          href: "/administration", icon: LayoutDashboard },
  { name: "Parking Management", href: "/parking",   icon: ParkingSquare },
  { name: "Vehicles",           href: "/vehicles",  icon: Car },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Parking Sessions", href: "/sessions", icon: Timer },
  { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Payments", href: "/payments", icon: Wallet },
  { name: "Tariffs", href: "/tariffs", icon: DollarSign },
  { name: "Barriers", href: "/barriers", icon: ShieldAlert },
  { name: "Incidents", href: "/incidents", icon: AlertTriangle },
  { name: "Users / Roles", href: "/users", icon: UserCog },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/administration" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ParkingCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">ParkAdmin</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <ParkingCircle className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm hover:bg-sidebar-accent"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      <nav className="mt-4 space-y-1 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
