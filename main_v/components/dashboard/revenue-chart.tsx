"use client"

import { DollarSign, Receipt, CreditCard, Users } from "lucide-react"

interface RevenueStatsProps {
  monthlyRevenue?: number
  pendingInvoices?: number
  activeSubscriptions?: number
  totalCustomers?: number
  isLoading?: boolean
}

function StatRow({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}
      </div>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  )
}

export function RevenueChart({
  monthlyRevenue,
  pendingInvoices,
  activeSubscriptions,
  totalCustomers,
  isLoading,
}: RevenueStatsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">
          Financial Summary
        </h3>
        <p className="text-sm text-muted-foreground">
          Live revenue and billing metrics
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
              <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div>
          {/* Big revenue number */}
          <div className="mb-6 rounded-xl bg-primary/10 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">This Month's Revenue</p>
            <p className="text-4xl font-bold text-primary">
              ${(monthlyRevenue ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <StatRow
            icon={Receipt}
            label="Pending Invoices"
            value={String(pendingInvoices ?? 0)}
            sub="Awaiting payment"
            color="bg-yellow-500/10 text-yellow-600"
          />
          <StatRow
            icon={CreditCard}
            label="Active Subscriptions"
            value={String(activeSubscriptions ?? 0)}
            sub="Recurring monthly"
            color="bg-blue-500/10 text-blue-600"
          />
          <StatRow
            icon={Users}
            label="Total Customers"
            value={String(totalCustomers ?? 0)}
            sub="Registered accounts"
            color="bg-primary/10 text-primary"
          />
        </div>
      )}
    </div>
  )
}
