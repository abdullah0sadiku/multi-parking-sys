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
  useBarriers,
  useCreateBarrier,
  useUpdateBarrier,
  useDeleteBarrier,
} from "@/hooks/useBarriers"
import { useParkingLevels } from "@/hooks/useParkingLevels"
import type { Barrier, BarrierStatus } from "@/types"

const barrierSchema = z.object({
  level_id: z.coerce.number().min(1, "Select a level"),
  name: z.string().min(1, "Name is required").max(255),
  location_note: z.string().optional().or(z.literal("")),
  status: z.enum(["operational", "maintenance", "offline"]).optional(),
})

type BarrierForm = z.infer<typeof barrierSchema>

const STATUS_OPTIONS: BarrierStatus[] = ["operational", "maintenance", "offline"]

const columns: Column<Barrier>[] = [
  { key: "name", label: "Name", sortable: true },
  {
    key: "level_name",
    label: "Level",
    render: (b) => b.level_name ?? `Level #${b.level_id}`,
  },
  {
    key: "location_note",
    label: "Location",
    render: (b) => b.location_note ?? "—",
  },
  {
    key: "status",
    label: "Status",
    render: (b) => (
      <StatusBadge status={b.status} variant={getStatusVariant(b.status)} />
    ),
  },
]

const PAGE_SIZE = 10

function BarrierFormModal({
  open,
  onClose,
  barrier,
}: {
  open: boolean
  onClose: () => void
  barrier: Barrier | null
}) {
  const isEdit = !!barrier
  const createMutation = useCreateBarrier()
  const updateMutation = useUpdateBarrier()
  const isPending = createMutation.isPending || updateMutation.isPending
  const { data: levelsData } = useParkingLevels({ limit: 100 })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BarrierForm>({
    resolver: zodResolver(barrierSchema),
    defaultValues: {
      level_id: barrier?.level_id ?? 0,
      name: barrier?.name ?? "",
      location_note: barrier?.location_note ?? "",
      status: barrier?.status ?? "operational",
    },
  })

  const onSubmit = (values: BarrierForm) => {
    const payload = {
      level_id: values.level_id,
      name: values.name,
      location_note: values.location_note || undefined,
      status: values.status,
    }
    if (isEdit && barrier) {
      updateMutation.mutate(
        { id: barrier.id, payload },
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
          <DialogTitle>{isEdit ? "Edit Barrier" : "Add Barrier"}</DialogTitle>
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
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="Main Entry Barrier" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location_note">Location Note</Label>
            <Input
              id="location_note"
              placeholder="North entrance, ramp A…"
              {...register("location_note")}
            />
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
              {isEdit ? "Save Changes" : "Add Barrier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function BarriersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Barrier | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Barrier | null>(null)

  const deleteMutation = useDeleteBarrier()
  const { data, isLoading } = useBarriers({
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
        { value: "operational", label: "Operational" },
        { value: "maintenance", label: "Maintenance" },
        { value: "offline", label: "Offline" },
      ],
    },
  ]

  return (
    <DashboardLayout>
      <DataTable
        title="Barriers"
        description="Manage entry and exit barriers"
        columns={columns}
        data={data?.data ?? []}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        isLoading={isLoading}
        searchPlaceholder="Search barriers…"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        filters={filters}
        onAdd={() => { setEditTarget(null); setFormOpen(true) }}
        onEdit={(b) => { setEditTarget(b); setFormOpen(true) }}
        onDelete={setDeleteTarget}
        addButtonLabel="Add Barrier"
      />

      <BarrierFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        barrier={editTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete barrier?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.name}</strong> permanently?
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
