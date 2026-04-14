"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DataTable, Column } from "@/components/shared/data-table"
import { StatusBadge, getStatusVariant } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  useParkingSpots,
  useCreateParkingSpot,
  useUpdateParkingSpot,
  useDeleteParkingSpot,
} from "@/hooks/useParkingSpots"
import { useParkingLevels } from "@/hooks/useParkingLevels"
import type { ParkingSpot, SpotStatus } from "@/types"

const spotSchema = z.object({
  level_id: z.coerce.number().min(1, "Select a level"),
  spot_code: z.string().min(1, "Spot code is required").max(64),
  status: z.enum(["available", "occupied", "reserved", "maintenance"]).optional(),
})

type SpotForm = z.infer<typeof spotSchema>

const STATUS_OPTIONS: SpotStatus[] = ["available", "occupied", "reserved", "maintenance"]

const columns: Column<ParkingSpot>[] = [
  { key: "spot_code", label: "Spot Code", sortable: true },
  {
    key: "level_name",
    label: "Level",
    render: (s) => s.level_name ?? `Level #${s.level_id}`,
  },
  {
    key: "status",
    label: "Status",
    render: (s) => (
      <StatusBadge status={s.status} variant={getStatusVariant(s.status)} />
    ),
  },
]

const PAGE_SIZE = 10

function SpotFormModal({
  open,
  onClose,
  spot,
}: {
  open: boolean
  onClose: () => void
  spot: ParkingSpot | null
}) {
  const isEdit = !!spot
  const createMutation = useCreateParkingSpot()
  const updateMutation = useUpdateParkingSpot()
  const isPending = createMutation.isPending || updateMutation.isPending
  const { data: levelsData } = useParkingLevels({ limit: 100 })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SpotForm>({
    resolver: zodResolver(spotSchema),
    defaultValues: {
      level_id: spot?.level_id ?? 0,
      spot_code: spot?.spot_code ?? "",
      status: spot?.status ?? "available",
    },
  })

  const onSubmit = (values: SpotForm) => {
    const payload = {
      level_id: values.level_id,
      spot_code: values.spot_code,
      status: values.status,
    }
    if (isEdit && spot) {
      updateMutation.mutate(
        { id: spot.id, payload },
        { onSuccess: () => { reset(); onClose() } }
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => { reset(); onClose() } })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Spot" : "Add Parking Spot"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="level_id">Level *</Label>
            <select
              id="level_id"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("level_id")}
            >
              <option value="">Select level…</option>
              {levelsData?.data.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            {errors.level_id && (
              <p className="text-xs text-destructive">{errors.level_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="spot_code">Spot Code *</Label>
            <Input id="spot_code" placeholder="A-001" {...register("spot_code")} />
            {errors.spot_code && (
              <p className="text-xs text-destructive">{errors.spot_code.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("status")}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Spot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function SpotsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ParkingSpot | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ParkingSpot | null>(null)

  const deleteMutation = useDeleteParkingSpot()
  const { data, isLoading } = useParkingSpots({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  })

  const filters = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: (v: string) => { setStatusFilter(v); setPage(1) },
      options: [
        { value: "all", label: "All Status" },
        { value: "available", label: "Available" },
        { value: "occupied", label: "Occupied" },
        { value: "reserved", label: "Reserved" },
        { value: "maintenance", label: "Maintenance" },
      ],
    },
  ]

  return (
    <DashboardLayout>
      <DataTable
        title="Parking Spots"
        description="Manage individual parking spaces"
        columns={columns}
        data={data?.data ?? []}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        isLoading={isLoading}
        searchPlaceholder="Search by spot code…"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        filters={filters}
        onAdd={() => { setEditTarget(null); setFormOpen(true) }}
        onEdit={(s) => { setEditTarget(s); setFormOpen(true) }}
        onDelete={setDeleteTarget}
        addButtonLabel="Add Spot"
      />

      <SpotFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        spot={editTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete spot?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete spot <strong>{deleteTarget?.spot_code}</strong> permanently?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
                  })
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
