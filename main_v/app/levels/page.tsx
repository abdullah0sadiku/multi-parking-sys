"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ParkingSpotGrid } from "@/components/parking/parking-spot-grid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useParkingLevels, useLevelSpots } from "@/hooks/useParking"
import type { ParkingLevel } from "@/types"

// ── Per-level spot grid (lazy loads when tab is selected) ─────────────────────

function LevelTabContent({ level }: { level: ParkingLevel }) {
  const { data, isLoading } = useLevelSpots(level.id)

  const spots = (data?.spots ?? []).map((s) => ({
    id: String(s.id),
    number: s.spot_code,
    status: s.status as "available" | "occupied" | "reserved" | "maintenance",
  }))

  const available   = spots.filter((s) => s.status === "available").length
  const occupied    = spots.filter((s) => s.status === "occupied").length
  const reserved    = spots.filter((s) => s.status === "reserved").length
  const maintenance = spots.filter((s) => s.status === "maintenance").length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spots</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{spots.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{available}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{occupied}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reserved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{reserved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Spot Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>{level.name} — Spot Grid</span>
            <div className="flex items-center gap-4 text-sm font-normal">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-success/40 border border-success/60" />
                <span className="text-muted-foreground">Available</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-destructive/40 border border-destructive/60" />
                <span className="text-muted-foreground">Occupied</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-warning/40 border border-warning/60" />
                <span className="text-muted-foreground">Reserved</span>
              </span>
              {maintenance > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-muted border border-muted-foreground/30" />
                  <span className="text-muted-foreground">Maintenance</span>
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(12, minmax(0,1fr))" }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : spots.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No spots found for this level.
            </p>
          ) : (
            <ParkingSpotGrid spots={spots} columns={12} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ParkingLevelsPage() {
  const { data: levelsData, isLoading } = useParkingLevels({ limit: 50 })
  const levels = levelsData?.data ?? []
  const [selectedLevel, setSelectedLevel] = useState<string>("")

  // Auto-select first level once loaded
  const activeTab = selectedLevel || (levels[0] ? String(levels[0].id) : "")

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Parking Levels</h1>
            <p className="text-muted-foreground">Visual overview of all parking levels and spots</p>
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (levels.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Parking Levels</h1>
            <p className="text-muted-foreground">Visual overview of all parking levels and spots</p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">No parking levels configured.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add levels from the Parking Management page.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Parking Levels</h1>
          <p className="text-muted-foreground">Visual overview of all parking levels and spots</p>
        </div>

        <Tabs value={activeTab} onValueChange={setSelectedLevel}>
          <TabsList className="flex h-auto flex-wrap gap-1">
            {levels.map((level) => (
              <TabsTrigger key={level.id} value={String(level.id)} className="px-5">
                {level.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {levels.map((level) => (
            <TabsContent key={level.id} value={String(level.id)} className="space-y-6 mt-6">
              <LevelTabContent level={level} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
