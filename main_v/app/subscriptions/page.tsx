"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, FileText } from "lucide-react"
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
  useSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
  useGenerateSubscriptionInvoice,
} from "@/hooks/useSubscriptions"
import { useCustomers } from "@/hooks/useCustomers"
import { useVehicles } from "@/hooks/useVehicles"
import { useTariffs } from "@/hooks/useTariffs"
import { useRecommendSpot } from "@/hooks/useParking"
import type { Subscription } from "@/types"
import { format } from "date-fns"

const subSchema = z.object({
  customer_id: z.coerce.number().min(1, "Select a customer"),
  vehicle_id:  z.coerce.number().min(1, "Select a vehicle"),
  spot_id:     z.coerce.number().optional(),
  tariff_id:   z.coerce.number().optional(),
  valid_from:  z.string().min(1, "Start date required"),
  valid_to:    z.string().min(1, "End date required"),
  monthly_fee: z.coerce.number().positive().optional(),
  auto_invoice: z.boolean().optional(),
})

type SubForm = z.infer<typeof subSchema>

const columns: Column<Subscription>[] = [
  {
    key: "customer_name",
    label: "Customer",
    render: (s) => s.customer_name ?? `#${s.customer_id}`,
  },
  {
    key: "license_plate",
    label: "Vehicle",
    render: (s) => <span className="font-mono">{s.license_plate ?? `#${s.vehicle_id}`}</span>,
  },
  {
    key: "tariff_name",
    label: "Plan",
    render: (s) => s.tariff_name ?? "—",
  },
  {
    key: "valid_from",
    label: "From",
    sortable: true,
    render: (s) => format(new Date(s.valid_from), "MMM d, yyyy"),
  },
  {
    key: "valid_to",
    label: "Until",
    sortable: true,
    render: (s) => format(new Date(s.valid_to), "MMM d, yyyy"),
  },
  {
    key: "monthly_fee",
    label: "Monthly Fee",
    render: (s) => (s.monthly_fee ? Number(s.monthly_fee).toFixed(2) : "—"),
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

function SubscriptionFormModal({
  open,
  onClose,
  subscription,
}: {
  open: boolean
  onClose: () => void
  subscription: Subscription | null
}) {
  const isEdit = !!subscription
  const createMutation = useCreateSubscription()
  const updateMutation = useUpdateSubscription()
  const isPending = createMutation.isPending || updateMutation.isPending
  const { data: customersData } = useCustomers({ limit: 200 })
  const { data: vehiclesData } = useVehicles({ limit: 200 })
  const { data: tariffsData } = useTariffs({ is_active: true, limit: 100 })
  const { data: recommendedSpots, isLoading: loadingSpots } = useRecommendSpot()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SubForm>({
    resolver: zodResolver(subSchema),
  })

  // Populate form whenever the modal opens or the target subscription changes
  useEffect(() => {
    if (open) {
      reset({
        customer_id:  subscription?.customer_id  ?? 0,
        vehicle_id:   subscription?.vehicle_id   ?? 0,
        spot_id:      subscription?.spot_id      ?? undefined,
        tariff_id:    subscription?.tariff_id    ?? undefined,
        // Date fields come as ISO strings — slice to YYYY-MM-DD for <input type="date">
        valid_from:   subscription?.valid_from   ? subscription.valid_from.slice(0, 10)  : "",
        valid_to:     subscription?.valid_to     ? subscription.valid_to.slice(0, 10)    : "",
        monthly_fee:  subscription?.monthly_fee  ?? undefined,
        auto_invoice: subscription?.auto_invoice ?? false,
      })
    }
  }, [open, subscription, reset])

  const onSubmit = (values: SubForm) => {
    const payload = {
      customer_id:  values.customer_id,
      vehicle_id:   values.vehicle_id,
      spot_id:      values.spot_id || undefined,
      tariff_id:    values.tariff_id || undefined,
      valid_from:   values.valid_from,
      valid_to:     values.valid_to,
      monthly_fee:  values.monthly_fee,
      auto_invoice: values.auto_invoice,
    }
    if (isEdit && subscription) {
      updateMutation.mutate(
        { id: subscription.id, payload },
        { onSuccess: () => { reset(); onClose() } }
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => { reset(); onClose() } })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Subscription" : "Create Subscription"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="customer_id">Customer *</Label>
              <select
                id="customer_id"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("customer_id")}
              >
                <option value="">Select…</option>
                {customersData?.data.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
              {errors.customer_id && (
                <p className="text-xs text-destructive">{errors.customer_id.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle_id">Vehicle *</Label>
              <select
                id="vehicle_id"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("vehicle_id")}
              >
                <option value="">Select…</option>
                {vehiclesData?.data.map((v) => (
                  <option key={v.id} value={v.id}>{v.license_plate}</option>
                ))}
              </select>
              {errors.vehicle_id && (
                <p className="text-xs text-destructive">{errors.vehicle_id.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tariff_id">Tariff Plan</Label>
            <select
              id="tariff_id"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("tariff_id")}
            >
              <option value="">No tariff</option>
              {tariffsData?.data.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="spot_id">Reserved Spot (optional)</Label>
              <span className="text-[11px] text-muted-foreground">
                {loadingSpots ? "Loading…" : `${recommendedSpots?.length ?? 0} available`}
              </span>
            </div>
            <select
              id="spot_id"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("spot_id")}
            >
              <option value="">No reserved spot</option>
              {subscription?.spot_id && (
                <option value={subscription.spot_id}>
                  {subscription.spot_code ?? `Spot #${subscription.spot_id}`} (current)
                </option>
              )}
              {recommendedSpots?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.spot_code} — available
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Spots are suggested in order: Level A → B → C. Selecting one reserves it for this subscriber.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="valid_from">Valid From *</Label>
              <Input id="valid_from" type="date" {...register("valid_from")} />
              {errors.valid_from && (
                <p className="text-xs text-destructive">{errors.valid_from.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valid_to">Valid To *</Label>
              <Input id="valid_to" type="date" {...register("valid_to")} />
              {errors.valid_to && (
                <p className="text-xs text-destructive">{errors.valid_to.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monthly_fee">Monthly Fee</Label>
            <Input
              id="monthly_fee"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("monthly_fee")}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="auto_invoice"
              type="checkbox"
              className="h-4 w-4 rounded border border-input"
              {...register("auto_invoice")}
            />
            <Label htmlFor="auto_invoice">Auto-generate monthly invoices</Label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Subscription | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null)

  const deleteMutation = useDeleteSubscription()
  const generateInvoiceMutation = useGenerateSubscriptionInvoice()

  const { data, isLoading } = useSubscriptions({
    page,
    limit: PAGE_SIZE,
    status: statusFilter !== "all" ? statusFilter : undefined,
  })

  const columnsWithActions: Column<Subscription>[] = [
    ...columns,
    {
      key: "invoice_action",
      label: "",
      render: (s) =>
        s.status === "active" ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            disabled={generateInvoiceMutation.isPending}
            onClick={(e) => {
              e.stopPropagation()
              generateInvoiceMutation.mutate(s.id)
            }}
          >
            <FileText className="h-3.5 w-3.5" />
            Invoice
          </Button>
        ) : null,
    },
  ]

  const filters = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: (v: string) => { setStatusFilter(v); setPage(1) },
      options: [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "expired", label: "Expired" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
  ]

  return (
    <DashboardLayout>
      <DataTable
        title="Subscriptions"
        description="Manage customer parking subscriptions"
        columns={columnsWithActions}
        data={data?.data ?? []}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        isLoading={isLoading}
        filters={filters}
        onAdd={() => { setEditTarget(null); setFormOpen(true) }}
        onEdit={(s) => { setEditTarget(s); setFormOpen(true) }}
        onDelete={setDeleteTarget}
        addButtonLabel="Create Subscription"
      />

      <SubscriptionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        subscription={editTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete subscription for{" "}
              <strong>{deleteTarget?.customer_name ?? `customer #${deleteTarget?.customer_id}`}</strong>?
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
