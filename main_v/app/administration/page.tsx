"use client"

import { useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ParkingCircle, Car, Timer, DollarSign, Receipt, AlertTriangle, Users } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { ParkingLevelCard } from "@/components/dashboard/parking-level-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { UsageChart } from "@/components/dashboard/usage-chart"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { PARKING_KEY, useParkingLevels } from "@/hooks/useParking"

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  spots: {
    total: number
    available: number
    occupied: number
    reserved: number
    maintenance: number
  }
  active_sessions: number
  monthly_revenue: number
  pending_invoices: number
  open_incidents: number
  total_customers: number
  total_vehicles: number
  active_subscriptions: number
  recent_sessions: Array<{
    id: number
    status: string
    started_at: string
    ended_at: string | null
    license_plate: string
    spot_code: string
    level_name: string
  }>
  recent_incidents: Array<{
    id: number
    title: string
    severity: string
    status: string
    reported_at: string
    license_plate: string | null
  }>
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(ENDPOINTS.STATS)
      return data.data as DashboardStats
    },
    refetchInterval: 30_000,
  })
}

// ── Activity builder ──────────────────────────────────────────────────────────

type ActivityType = "session" | "payment" | "incident" | "entry"

interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  time: string
}

function buildActivity(stats: DashboardStats): Activity[] {
  const items: Activity[] = []

  for (const s of stats.recent_sessions) {
    const isActive = s.status === "active"
    items.push({
      id: `session-${s.id}`,
      type: isActive ? "entry" : "session",
      title: isActive ? "Active Session" : "Session Completed",
      description: `${s.license_plate} — ${s.spot_code} (${s.level_name})`,
      time: formatDistanceToNow(new Date(s.started_at), { addSuffix: true }),
    })
  }

  for (const i of stats.recent_incidents) {
    items.push({
      id: `incident-${i.id}`,
      type: "incident",
      title: i.title,
      description: i.license_plate
        ? `Vehicle ${i.license_plate} · ${i.severity} severity`
        : `Severity: ${i.severity}`,
      time: formatDistanceToNow(new Date(i.reported_at), { addSuffix: true }),
    })
  }

  return items.slice(0, 8)
}

// ── KPI skeleton ──────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdministrationPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: levelsData, isLoading: levelsLoading } = useParkingLevels({ limit: 10 })

  const levels = levelsData?.data ?? []
  const activities = stats ? buildActivity(stats) : []

  const occupancyPct = stats
    ? stats.spots.total > 0
      ? Math.round((stats.spots.occupied / stats.spots.total) * 100)
      : 0
    : null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Live overview of your parking facility</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          ) : (
            <>
              <KpiCard
                title="Total Spots"
                value={stats?.spots.total ?? 0}
                change={`${stats?.spots.available ?? 0} available now`}
                changeType="positive"
                icon={ParkingCircle}
                iconColor="bg-primary/10 text-primary"
              />
              <KpiCard
                title="Available Spots"
                value={stats?.spots.available ?? 0}
                change={
                  occupancyPct !== null
                    ? `${occupancyPct}% occupancy`
                    : undefined
                }
                changeType={
                  occupancyPct !== null && occupancyPct >= 90
                    ? "negative"
                    : occupancyPct !== null && occupancyPct >= 70
                    ? "neutral"
                    : "positive"
                }
                icon={Car}
                iconColor="bg-success/10 text-success"
              />
              <KpiCard
                title="Active Sessions"
                value={stats?.active_sessions ?? 0}
                change={`${stats?.active_subscriptions ?? 0} active subscriptions`}
                changeType="neutral"
                icon={Timer}
                iconColor="bg-warning/10 text-warning"
              />
              <KpiCard
                title="Monthly Revenue"
                value={`$${(stats?.monthly_revenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                change={`${stats?.pending_invoices ?? 0} pending invoices`}
                changeType={stats?.pending_invoices ? "neutral" : "positive"}
                icon={DollarSign}
                iconColor="bg-chart-2/10 text-chart-2"
              />
            </>
          )}
        </div>

        {/* Secondary KPIs */}
        {!statsLoading && (
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              title="Total Customers"
              value={stats?.total_customers ?? 0}
              change={`${stats?.total_vehicles ?? 0} vehicles registered`}
              changeType="neutral"
              icon={Users}
              iconColor="bg-primary/10 text-primary"
            />
            <KpiCard
              title="Pending Invoices"
              value={stats?.pending_invoices ?? 0}
              changeType={stats?.pending_invoices ? "negative" : "positive"}
              change={stats?.pending_invoices ? "Awaiting payment" : "All invoices paid"}
              icon={Receipt}
              iconColor="bg-destructive/10 text-destructive"
            />
            <KpiCard
              title="Open Incidents"
              value={stats?.open_incidents ?? 0}
              changeType={stats?.open_incidents ? "negative" : "positive"}
              change={stats?.open_incidents ? "Require attention" : "No open incidents"}
              icon={AlertTriangle}
              iconColor="bg-warning/10 text-warning"
            />
          </div>
        )}

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UsageChart spots={stats?.spots} isLoading={statsLoading} />
          <RevenueChart
            monthlyRevenue={stats?.monthly_revenue}
            pendingInvoices={stats?.pending_invoices}
            activeSubscriptions={stats?.active_subscriptions}
            totalCustomers={stats?.total_customers}
            isLoading={statsLoading}
          />
        </div>

        {/* Level Status + Activity Feed */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Parking Level Status</h2>
            {levelsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : levels.length === 0 ? (
              <p className="text-sm text-muted-foreground">No levels configured.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {levels.map((level) => (
                  <ParkingLevelCard
                    key={level.id}
                    level={level.name}
                    total={Number(level.total_spots ?? 0)}
                    occupied={Number(level.occupied_spots ?? 0)}
                    available={Number(level.available_spots ?? 0)}
                    reserved={Number(level.reserved_spots ?? 0)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            {statsLoading ? (
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="divide-y divide-border">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-4">
                      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ActivityFeed activities={activities.length > 0 ? activities : [
                {
                  id: "empty",
                  type: "session" as const,
                  title: "No recent activity",
                  description: "Sessions and incidents will appear here",
                  time: "",
                }
              ]} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
