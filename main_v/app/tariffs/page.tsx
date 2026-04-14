"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DataTable, Column } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
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
  useTariffs,
  useCreateTariff,
  useUpdateTariff,
  useDeleteTariff,
} from "@/hooks/useTariffs"
import type { Tariff } from "@/types"

const tariffSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  rate_per_hour: z.coerce.number().positive("Rate must be positive"),
  vat_percent: z.coerce.number().min(0).max(100).optional(),
  currency: z.string().length(3, "Currency must be 3 characters").optional().or(z.literal("")),
  is_active: z.boolean().optional(),
})

type TariffForm = z.infer<typeof tariffSchema>

const columns: Column<Tariff>[] = [
  { key: "name", label: "Name", sortable: true },
  {
    key: "rate_per_hour",
    label: "Rate / Hour",
    sortable: true,
    render: (t) => (
      <span className="font-medium">
        {t.currency} {Number(t.rate_per_hour).toFixed(2)}
      </span>
    ),
  },
  {
    key: "vat_percent",
    label: "VAT %",
    render: (t) => `${t.vat_percent}%`,
  },
  {
    key: "is_active",
    label: "Status",
    render: (t) => (
      <StatusBadge
        status={t.is_active ? "Active" : "Inactive"}
        variant={t.is_active ? "success" : "default"}
      />
    ),
  },
]

const PAGE_SIZE = 10

function TariffFormModal({
  open,
  onClose,
  tariff,
}: {
  open: boolean
  onClose: () => void
  tariff: Tariff | null
}) {
  const isEdit = !!tariff
  const createMutation = useCreateTariff()
  const updateMutation = useUpdateTariff()
  const isPending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TariffForm>({
    resolver: zodResolver(tariffSchema),
    defaultValues: {
      name: tariff?.name ?? "",
      rate_per_hour: tariff?.rate_per_hour ?? 0,
      vat_percent: tariff?.vat_percent ?? 20,
      currency: tariff?.currency ?? "USD",
      is_active: tariff?.is_active ?? true,
    },
  })

  const onSubmit = (values: TariffForm) => {
    const payload = {
      name: values.name,
      rate_per_hour: values.rate_per_hour,
      vat_percent: values.vat_percent,
      currency: values.currency || "USD",
      is_active: values.is_active,
    }
    if (isEdit && tariff) {
      updateMutation.mutate(
        { id: tariff.id, payload },
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
          <DialogTitle>{isEdit ? "Edit Tariff" : "Create Tariff"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="Standard Rate" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rate_per_hour">Rate / Hour *</Label>
              <Input
                id="rate_per_hour"
                type="number"
                step="0.01"
                placeholder="3.50"
                {...register("rate_per_hour")}
              />
              {errors.rate_per_hour && (
                <p className="text-xs text-destructive">{errors.rate_per_hour.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                placeholder="USD"
                maxLength={3}
                {...register("currency")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vat_percent">VAT %</Label>
            <Input
              id="vat_percent"
              type="number"
              step="0.1"
              placeholder="20"
              {...register("vat_percent")}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              className="h-4 w-4 rounded border border-input"
              {...register("is_active")}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Tariff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function TariffsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Tariff | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tariff | null>(null)

  const deleteMutation = useDeleteTariff()
  const { data, isLoading } = useTariffs({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  })

  return (
    <DashboardLayout>
      <DataTable
        title="Tariffs"
        description="Manage parking rate plans"
        columns={columns}
        data={data?.data ?? []}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        isLoading={isLoading}
        searchPlaceholder="Search tariffs…"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onAdd={() => { setEditTarget(null); setFormOpen(true) }}
        onEdit={(t) => { setEditTarget(t); setFormOpen(true) }}
        onDelete={setDeleteTarget}
        addButtonLabel="Create Tariff"
      />

      <TariffFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        tariff={editTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tariff?</AlertDialogTitle>
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
