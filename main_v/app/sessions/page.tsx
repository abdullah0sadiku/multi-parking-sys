"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, StopCircle, BadgeDollarSign, Car, ScanLine } from "lucide-react"
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
import { useSessions, useCreateSession, useEndSession, useMarkSessionPaid } from "@/hooks/useSessions"
import { useParkingSpots } from "@/hooks/useParkingSpots"
import { useTariffs } from "@/hooks/useTariffs"
import type { ParkingSession } from "@/types"
import { format } from "date-fns"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ─── Column definitions ───────────────────────────────────────────────────────

const columns: Column<ParkingSession>[] = [
  {
    key: "license_plate",
    label: "Vehicle",
    render: (s) => (
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Car className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-mono font-semibold text-foreground">
            {s.license_plate ?? `#${s.vehicle_id}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {s.customer_name ?? "Walk-in"}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "spot_code",
    label: "Spot",
    render: (s) => (
      <div>
        <p className="font-medium">{s.spot_code ?? "—"}</p>
        {s.level_name && (
          <p className="text-xs text-muted-foreground">{s.level_name}</p>
        )}
      </div>
    ),
  },
  {
    key: "started_at",
    label: "Entry",
    sortable: true,
    render: (s) => format(new Date(s.started_at), "MMM d, HH:mm"),
  },
  {
    key: "ended_at",
    label: "Exit",
    render: (s) =>
      s.ended_at ? format(new Date(s.ended_at), "MMM d, HH:mm") : "—",
  },
  {
    key: "duration_minutes",
    label: "Duration",
    render: (s) => formatDuration(s.duration_minutes),
  },
  {
    key: "tariff_name",
    label: "Tariff",
    render: (s) => s.tariff_name ?? "—",
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

// ─── Start session modal ──────────────────────────────────────────────────────

const sessionSchema = z.object({
  license_plate: z.string().min(1, "License plate is required").max(32),
  spot_id:       z.coerce.number().int().positive().optional(),
  tariff_id:     z.coerce.number().int().positive().optional(),
  notes:         z.string().optional(),
})
type SessionForm = z.infer<typeof sessionSchema>

function StartSessionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMutation  = useCreateSession()
  const { data: spotsData }   = useParkingSpots({ status: "available", limit: 100 })
  const { data: tariffsData } = useTariffs({ is_active: true, limit: 100 })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
  })

  const onSubmit = (values: SessionForm) => {
    createMutation.mutate(
      {
        license_plate: values.license_plate.trim().toUpperCase(),
        spot_id:  values.spot_id  || undefined,
        tariff_id: values.tariff_id || undefined,
        notes: values.notes || undefined,
      },
      { onSuccess: () => { reset(); onClose() } }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            Start Walk-in Session
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">

          {/* Info banner */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
            Sessions are for <strong>walk-in vehicles only</strong>. Subscribed customers
            use their reserved spots — they do not appear here.
          </div>

          {/* License plate — primary identifier */}
          <div className="space-y-1.5">
            <Label htmlFor="lp">License Plate *</Label>
            <Input
              id="lp"
              placeholder="e.g. AB-1234-CD"
              className="font-mono text-base uppercase tracking-widest"
              {...register("license_plate")}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase()
                register("license_plate").onChange(e)
              }}
            />
            <p className="text-xs text-muted-foreground">
              If the plate is not registered it will be added automatically.
            </p>
            {errors.license_plate && (
              <p className="text-xs text-destructive">{errors.license_plate.message}</p>
            )}
          </div>

          {/* Spot — only available spots shown */}
          <div className="space-y-1.5">
            <Label htmlFor="spot_id">
              Parking Spot
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                ({spotsData?.data.length ?? 0} available)
              </span>
            </Label>
            <select
              id="spot_id"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("spot_id")}
            >
              <option value="">Auto-assign first available</option>
              {spotsData?.data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.spot_code}{s.level_name ? ` — ${s.level_name}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Tariff */}
          <div className="space-y-1.5">
            <Label htmlFor="tariff_id">Tariff</Label>
            <select
              id="tariff_id"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("tariff_id")}
            >
              <option value="">Default (first active tariff)</option>
              {tariffsData?.data.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.currency} {t.rate_per_hour}/hr
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" placeholder="Optional notes…" {...register("notes")} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="gap-2">
              {createMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ScanLine className="h-4 w-4" />}
              Start Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Mark as Paid dialog ──────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: "POS",  label: "POS Terminal",  desc: "Credit / debit card via terminal" },
  { value: "Cash", label: "Cash",          desc: "Physical cash payment" },
  { value: "Card", label: "Card (manual)", desc: "Card details entered manually" },
] as const

type PayMethod = "POS" | "Cash" | "Card"

function MarkPaidDialog({
  session,
  onClose,
}: {
  session: ParkingSession | null
  onClose: () => void
}) {
  const [method, setMethod] = useState<PayMethod>("POS")
  const payMutation = useMarkSessionPaid()

  const amount = session?.invoice_total != null
    ? `$${Number(session.invoice_total).toFixed(2)}`
    : "—"

  function handleConfirm() {
    if (!session) return
    payMutation.mutate(
      { id: session.id, method },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <Dialog open={!!session} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-primary" />
            Mark as Paid
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Session summary */}
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle</span>
              <span className="font-mono font-semibold">
                {session?.license_plate ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span>{session?.customer_name ?? "Walk-in"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span>{session ? formatDuration(session.duration_minutes) : "—"}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border">
              <span className="font-semibold">Amount due</span>
              <span className="font-bold text-primary text-base">{amount}</span>
            </div>
          </div>

          {/* Payment method selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Payment method</p>
            <div className="grid gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                    method === m.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 transition-colors ${
                    method === m.value
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={payMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={payMutation.isPending} className="gap-2">
            {payMutation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <BadgeDollarSign className="h-4 w-4" />}
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [formOpen, setFormOpen]   = useState(false)
  const [endTarget, setEndTarget] = useState<ParkingSession | null>(null)
  const [payTarget, setPayTarget] = useState<ParkingSession | null>(null)

  const endMutation = useEndSession()

  const { data, isLoading } = useSessions({
    page,
    limit: PAGE_SIZE,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
  })

  const columnsWithActions: Column<ParkingSession>[] = [
    ...columns,
    {
      key: "actions",
      label: "",
      render: (s) => (
        <div className="flex items-center gap-2">
          {s.status === "active" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={(e) => { e.stopPropagation(); setEndTarget(s) }}
            >
              <StopCircle className="h-3.5 w-3.5" />
              End
            </Button>
          )}
          {s.status === "completed" && s.invoice_status !== "paid" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              onClick={(e) => { e.stopPropagation(); setPayTarget(s) }}
            >
              <BadgeDollarSign className="h-3.5 w-3.5" />
              Mark Paid
            </Button>
          )}
          {s.status === "completed" && s.invoice_status === "paid" && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-200 dark:border-emerald-800">
              <BadgeDollarSign className="h-3.5 w-3.5" />
              Paid
            </span>
          )}
        </div>
      ),
    },
  ]

  const filters = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: (v: string) => { setStatusFilter(v); setPage(1) },
      options: [
        { value: "all",       label: "All Status" },
        { value: "active",    label: "Active" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
  ]

  return (
    <DashboardLayout>
      <DataTable
        title="Walk-in Parking Sessions"
        description="Manage sessions for non-subscribed walk-in vehicles"
        columns={columnsWithActions}
        data={data?.data ?? []}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        isLoading={isLoading}
        searchPlaceholder="Search by plate, customer…"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        filters={filters}
        onAdd={() => setFormOpen(true)}
        addButtonLabel="Start Session"
      />

      <StartSessionModal open={formOpen} onClose={() => setFormOpen(false)} />

      {/* End session confirmation */}
      <AlertDialog open={!!endTarget} onOpenChange={(o) => !o && setEndTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End parking session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the active session for{" "}
              <strong className="font-mono">{endTarget?.license_plate ?? `#${endTarget?.vehicle_id}`}</strong>
              {" "}and generate an invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (endTarget) {
                  endMutation.mutate(endTarget.id, {
                    onSuccess: () => setEndTarget(null),
                  })
                }
              }}
            >
              {endMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as paid dialog */}
      <MarkPaidDialog session={payTarget} onClose={() => setPayTarget(null)} />
    </DashboardLayout>
  )
}
