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
  useIncidents,
  useCreateIncident,
  useUpdateIncident,
  useDeleteIncident,
} from "@/hooks/useIncidents"
import { useVehicles } from "@/hooks/useVehicles"
import type { Incident, IncidentSeverity, IncidentStatus } from "@/types"
import { format } from "date-fns"

const incidentSchema = z.object({
  vehicle_id: z.coerce.number().min(1, "Select a vehicle"),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional().or(z.literal("")),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z.enum(["open", "resolved", "closed"]).optional(),
})

type IncidentForm = z.infer<typeof incidentSchema>

const SEVERITY_OPTIONS: IncidentSeverity[] = ["low", "medium", "high", "critical"]
const STATUS_OPTIONS: IncidentStatus[] = ["open", "resolved", "closed"]

const SEVERITY_VARIANT: Record<IncidentSeverity, string> = {
  low: "default",
  medium: "warning",
  high: "error",
  critical: "error",
}

const columns: Column<Incident>[] = [
  { key: "title", label: "Title", sortable: true },
  {
    key: "license_plate",
    label: "Vehicle",
    render: (i) => (
      <span className="font-mono">{i.license_plate ?? `#${i.vehicle_id}`}</span>
    ),
  },
  {
    key: "severity",
    label: "Severity",
    render: (i) => (
      <StatusBadge
        status={i.severity}
        variant={SEVERITY_VARIANT[i.severity] as "default" | "warning" | "error"}
      />
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (i) => (
      <StatusBadge status={i.status} variant={getStatusVariant(i.status)} />
    ),
  },
  {
    key: "reported_at",
    label: "Reported",
    sortable: true,
    render: (i) => format(new Date(i.reported_at), "MMM d, yyyy"),
  },
]

const PAGE_SIZE = 10

function IncidentFormModal({
  open,
  onClose,
  incident,
}: {
  open: boolean
  onClose: () => void
  incident: Incident | null
}) {
  const isEdit = !!incident
  const createMutation = useCreateIncident()
  const updateMutation = useUpdateIncident()
  const isPending = createMutation.isPending || updateMutation.isPending
  const { data: vehiclesData } = useVehicles({ limit: 200 })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IncidentForm>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      vehicle_id: incident?.vehicle_id ?? 0,
      title: incident?.title ?? "",
      description: incident?.description ?? "",
      severity: incident?.severity ?? "medium",
      status: incident?.status ?? "open",
    },
  })

  const onSubmit = (values: IncidentForm) => {
    const payload = {
      vehicle_id: values.vehicle_id,
      title: values.title,
      description: values.description || undefined,
      severity: values.severity,
      status: values.status,
    }
    if (isEdit && incident) {
      updateMutation.mutate(
        { id: incident.id, payload },
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
          <DialogTitle>{isEdit ? "Edit Incident" : "Report Incident"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="vehicle_id">Vehicle *</Label>
            <select
              id="vehicle_id"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("vehicle_id")}
            >
              <option value="">Select vehicle…</option>
              {vehiclesData?.data.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.license_plate}
                </option>
              ))}
            </select>
            {errors.vehicle_id && (
              <p className="text-xs text-destructive">{errors.vehicle_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" placeholder="Incident description" {...register("title")} />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Details</Label>
            <Input
              id="description"
              placeholder="Additional details…"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="severity">Severity</Label>
              <select
                id="severity"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("severity")}
              >
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
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
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Report Incident"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function IncidentsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Incident | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Incident | null>(null)

  const deleteMutation = useDeleteIncident()
  const { data, isLoading } = useIncidents({
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
        { value: "open", label: "Open" },
        { value: "resolved", label: "Resolved" },
        { value: "closed", label: "Closed" },
      ],
    },
  ]

  return (
    <DashboardLayout>
      <DataTable
        title="Incidents"
        description="Track and manage reported incidents"
        columns={columns}
        data={data?.data ?? []}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        isLoading={isLoading}
        searchPlaceholder="Search incidents…"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        filters={filters}
        onAdd={() => { setEditTarget(null); setFormOpen(true) }}
        onEdit={(i) => { setEditTarget(i); setFormOpen(true) }}
        onDelete={setDeleteTarget}
        addButtonLabel="Report Incident"
      />

      <IncidentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        incident={editTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete incident?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete incident <strong>{deleteTarget?.title}</strong> permanently?
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
