"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  Wrench,
  Car,
  Square,
  Trash2,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import {
  useCreateParkingLevel,
  useDeleteParkingLevel,
  useGenerateSpots,
  useLevelSpots,
  useParkingLevels,
  useUpdateSpotStatus,
} from "@/hooks/useParking"
import type { ParkingLevel, ParkingSpot, SpotStatus } from "@/types"

// ── Spot status config ────────────────────────────────────────────────────────

const SPOT_COLORS: Record<SpotStatus, string> = {
  available:   "bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30 cursor-pointer",
  occupied:    "bg-red-500/20    border-red-500/50    cursor-not-allowed",
  reserved:    "bg-amber-500/20  border-amber-500/50  cursor-not-allowed",
  maintenance: "bg-slate-500/20  border-slate-500/50  hover:bg-slate-500/30 cursor-pointer",
}

const STATUS_DOT: Record<SpotStatus, string> = {
  available:   "bg-emerald-500",
  occupied:    "bg-red-500",
  reserved:    "bg-amber-500",
  maintenance: "bg-slate-400",
}

// ── Level create form ─────────────────────────────────────────────────────────

const levelSchema = z.object({
  name:         z.string().min(1, "Name required"),
  prefix:       z.string().min(1).max(10, "Max 10 chars"),
  floor_number: z.coerce.number().int(),
  capacity:     z.coerce.number().int().min(1).max(500),
  description:  z.string().optional(),
})
type LevelForm = z.infer<typeof levelSchema>

function CreateLevelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateParkingLevel()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LevelForm>({
    resolver: zodResolver(levelSchema),
    defaultValues: { floor_number: 0, capacity: 50 },
  })

  function onSubmit(values: LevelForm) {
    create.mutate(values, {
      onSuccess: () => { reset(); onClose() },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Parking Level</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Level Name</Label>
              <Input placeholder="e.g. Level D - Third" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Spot Prefix</Label>
              <Input placeholder="e.g. D" maxLength={10} {...register("prefix")} className="uppercase" />
              <p className="text-xs text-muted-foreground">Spots will be D001, D002…</p>
              {errors.prefix && <p className="text-xs text-destructive">{errors.prefix.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Floor Number</Label>
              <Input type="number" {...register("floor_number")} />
              {errors.floor_number && <p className="text-xs text-destructive">{errors.floor_number.message}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Capacity (spots)</Label>
              <Input type="number" min={1} max={500} {...register("capacity")} />
              <p className="text-xs text-muted-foreground">Spots are auto-generated on save.</p>
              {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Description (optional)</Label>
              <Input {...register("description")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create Level"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Spot grid for an expanded level ──────────────────────────────────────────

function LevelSpotGrid({ levelId }: { levelId: number }) {
  const { data, isLoading } = useLevelSpots(levelId)
  const updateStatus = useUpdateSpotStatus()
  const [confirmSpot, setConfirmSpot] = useState<{ spot: ParkingSpot; newStatus: "available" | "maintenance" } | null>(null)

  if (isLoading) {
    return (
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(12, minmax(0,1fr))" }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const spots = data?.spots ?? []

  function handleSpotClick(spot: ParkingSpot) {
    if (spot.status === "occupied" || spot.status === "reserved") return
    const newStatus = spot.status === "available" ? "maintenance" : "available"
    setConfirmSpot({ spot, newStatus })
  }

  function confirmChange() {
    if (!confirmSpot) return
    updateStatus.mutate(
      { spotId: confirmSpot.spot.id, status: confirmSpot.newStatus },
      { onSettled: () => setConfirmSpot(null) }
    )
  }

  return (
    <>
      <TooltipProvider>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(12, minmax(0,1fr))" }}>
          {spots.map((spot) => (
            <Tooltip key={spot.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleSpotClick(spot)}
                  className={cn(
                    "relative flex h-12 w-full flex-col items-center justify-center rounded-lg border-2 transition-all text-xs font-medium",
                    SPOT_COLORS[spot.status]
                  )}
                >
                  {spot.status === "occupied" && <Car className="mb-0.5 h-3 w-3 text-red-600" />}
                  {spot.status === "maintenance" && <Wrench className="mb-0.5 h-3 w-3 text-slate-500" />}
                  <span className="text-[10px] leading-none text-foreground/70">{spot.spot_code}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-medium">{spot.spot_code}</p>
                <p className="capitalize text-xs">
                  Status: <span className="font-medium">{spot.status}</span>
                </p>
                {(spot.status === "available" || spot.status === "maintenance") && (
                  <p className="text-xs text-muted-foreground">Click to toggle maintenance</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      <AlertDialog open={!!confirmSpot} onOpenChange={() => setConfirmSpot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Spot Status</AlertDialogTitle>
            <AlertDialogDescription>
              Set <strong>{confirmSpot?.spot.spot_code}</strong> to{" "}
              <strong className="capitalize">{confirmSpot?.newStatus}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange} disabled={updateStatus.isPending}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── Level card ────────────────────────────────────────────────────────────────

function LevelCard({ level }: { level: ParkingLevel }) {
  const [expanded, setExpanded] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteLevel = useDeleteParkingLevel()
  const generateSpots = useGenerateSpots()

  const total       = Number(level.total_spots       ?? 0)
  const available   = Number(level.available_spots   ?? 0)
  const occupied    = Number(level.occupied_spots    ?? 0)
  const reserved    = Number(level.reserved_spots    ?? 0)
  const maintenance = Number(level.maintenance_spots ?? 0)
  const occupancy   = total > 0 ? Math.round((occupied / total) * 100) : 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-3 text-left"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-base">{level.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Prefix: <strong>{level.prefix}</strong> · Floor {level.floor_number} · {total} spots
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* occupancy bar */}
            <div className="hidden sm:flex items-center gap-2 mr-4">
              <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500 transition-all"
                  style={{ width: `${occupancy}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{occupancy}% full</span>
            </div>

            <Button
              size="sm"
              variant="ghost"
              title="Re-generate missing spots"
              disabled={generateSpots.isPending}
              onClick={() => generateSpots.mutate(level.id)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick stat chips */}
        <div className="flex flex-wrap gap-2 mt-3 ml-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs">
            <span className={cn("h-2 w-2 rounded-full", STATUS_DOT.available)} />
            {available} Available
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs">
            <span className={cn("h-2 w-2 rounded-full", STATUS_DOT.occupied)} />
            {occupied} Occupied
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs">
            <span className={cn("h-2 w-2 rounded-full", STATUS_DOT.reserved)} />
            {reserved} Reserved
          </span>
          {maintenance > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs">
              <span className={cn("h-2 w-2 rounded-full", STATUS_DOT.maintenance)} />
              {maintenance} Maintenance
            </span>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4">
          <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground ml-2">
            <span className="flex items-center gap-1"><Square className="h-3 w-3 fill-emerald-500/30 text-emerald-500" /> Available</span>
            <span className="flex items-center gap-1"><Car    className="h-3 w-3 text-red-500"    /> Occupied</span>
            <span className="flex items-center gap-1"><Square className="h-3 w-3 fill-amber-500/30 text-amber-500"  /> Reserved</span>
            <span className="flex items-center gap-1"><Wrench className="h-3 w-3 text-slate-400"  /> Maintenance</span>
            <span className="ml-auto text-[11px]">Click a spot to toggle maintenance</span>
          </div>
          <LevelSpotGrid levelId={level.id} />
        </CardContent>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {level.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the level and all {total} spots. Sessions and subscriptions
              linked to these spots will lose their spot reference.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLevel.isPending}
              onClick={() => deleteLevel.mutate(level.id, { onSuccess: () => setDeleteOpen(false) })}
            >
              Delete Level
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ParkingManagementPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data, isLoading } = useParkingLevels({ limit: 50 })

  const levels = data?.data ?? []

  const globalStats = levels.reduce(
    (acc, l) => ({
      total:       acc.total       + Number(l.total_spots       ?? 0),
      available:   acc.available   + Number(l.available_spots   ?? 0),
      occupied:    acc.occupied    + Number(l.occupied_spots    ?? 0),
      reserved:    acc.reserved    + Number(l.reserved_spots    ?? 0),
      maintenance: acc.maintenance + Number(l.maintenance_spots ?? 0),
    }),
    { total: 0, available: 0, occupied: 0, reserved: 0, maintenance: 0 }
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Parking Management</h1>
            <p className="text-muted-foreground">
              Manage levels, auto-generate spots, and monitor occupancy in real time.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Level
          </Button>
        </div>

        {/* Global KPIs */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-5">
            {[
              { label: "Total Spots",  value: globalStats.total,       color: "" },
              { label: "Available",    value: globalStats.available,    color: "text-emerald-600" },
              { label: "Occupied",     value: globalStats.occupied,     color: "text-red-600" },
              { label: "Reserved",     value: globalStats.reserved,     color: "text-amber-600" },
              { label: "Maintenance",  value: globalStats.maintenance,  color: "text-slate-500" },
            ].map((s) => (
              <Card key={s.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Level cards */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : levels.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Car className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">No parking levels configured.</p>
                <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Level
                </Button>
              </CardContent>
            </Card>
          ) : (
            levels.map((level) => <LevelCard key={level.id} level={level} />)
          )}
        </div>
      </div>

      <CreateLevelModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </DashboardLayout>
  )
}
