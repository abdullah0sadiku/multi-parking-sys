"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DataTable, Column } from "@/components/shared/data-table"
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
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
} from "@/hooks/useVehicles"
import { useCustomers } from "@/hooks/useCustomers"
import type { Vehicle } from "@/types"
import { format } from "date-fns"

const vehicleSchema = z.object({
  customer_id: z.coerce.number().min(1, "Select a customer"),
  license_plate: z.string().min(1, "License plate is required").max(32),
  vehicle_type: z.string().max(64).optional().or(z.literal("")),
})

type VehicleForm = z.infer<typeof vehicleSchema>

const columns: Column<Vehicle>[] = [
  {
    key: "license_plate",
    label: "License Plate",
    sortable: true,
    render: (v) => <span className="font-mono font-semibold">{v.license_plate}</span>,
  },
  { key: "vehicle_type", label: "Type", render: (v) => v.vehicle_type ?? "—" },
  {
    key: "customer_name",
    label: "Owner",
    render: (v) => v.customer_name ?? `Customer #${v.customer_id}`,
  },
  {
    key: "created_at",
    label: "Registered",
    sortable: true,
    render: (v) => format(new Date(v.created_at), "MMM d, yyyy"),
  },
]

const PAGE_SIZE = 10

function VehicleFormModal({
  open,
  onClose,
  vehicle,
}: {
  open: boolean
  onClose: () => void
  vehicle: Vehicle | null
}) {
  const isEdit = !!vehicle
  const createMutation = useCreateVehicle()
  const updateMutation = useUpdateVehicle()
  const isPending = createMutation.isPending || updateMutation.isPending
  const { data: customersData } = useCustomers({ limit: 200 })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      customer_id: vehicle?.customer_id ?? 0,
      license_plate: vehicle?.license_plate ?? "",
      vehicle_type: vehicle?.vehicle_type ?? "",
    },
  })

  const onSubmit = (values: VehicleForm) => {
    const payload = {
      customer_id: values.customer_id,
      license_plate: values.license_plate,
      vehicle_type: values.vehicle_type || undefined,
    }
    if (isEdit && vehicle) {
      updateMutation.mutate(
        { id: vehicle.id, payload },
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
          <DialogTitle>{isEdit ? "Edit Vehicle" : "Register Vehicle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="customer_id">Customer *</Label>
            <select
              id="customer_id"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("customer_id")}
            >
              <option value="">Select customer…</option>
              {customersData?.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="text-xs text-destructive">{errors.customer_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="license_plate">License Plate *</Label>
            <Input
              id="license_plate"
              placeholder="ABC-1234"
              {...register("license_plate")}
            />
            {errors.license_plate && (
              <p className="text-xs text-destructive">{errors.license_plate.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Input
              id="vehicle_type"
              placeholder="Sedan, SUV, Motorcycle…"
              {...register("vehicle_type")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Register Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function VehiclesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)

  const deleteMutation = useDeleteVehicle()
  const { data, isLoading } = useVehicles({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  })

  return (
    <DashboardLayout>
      <DataTable
        title="Vehicles"
        description="Manage registered vehicles"
        columns={columns}
        data={data?.data ?? []}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        isLoading={isLoading}
        searchPlaceholder="Search by plate, owner…"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onAdd={() => { setEditTarget(null); setFormOpen(true) }}
        onEdit={(v) => { setEditTarget(v); setFormOpen(true) }}
        onDelete={setDeleteTarget}
        addButtonLabel="Register Vehicle"
      />

      <VehicleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        vehicle={editTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{deleteTarget?.license_plate}</strong> permanently?
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
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
