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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePayments, useCreatePayment } from "@/hooks/usePayments"
import { useInvoices } from "@/hooks/useInvoices"
import type { Payment } from "@/types"
import { format } from "date-fns"

const paymentSchema = z.object({
  invoice_id: z.coerce.number().min(1, "Select an invoice"),
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.string().min(1, "Payment method is required"),
  transaction_ref: z.string().optional().or(z.literal("")),
})

type PaymentForm = z.infer<typeof paymentSchema>

const columns: Column<Payment>[] = [
  {
    key: "id",
    label: "Transaction",
    render: (p) => (
      <span className="font-mono text-sm font-medium">
        TXN-{String(p.id).padStart(5, "0")}
      </span>
    ),
  },
  {
    key: "customer_name",
    label: "Customer",
    render: (p) => p.customer_name ?? `Invoice #${p.invoice_id}`,
  },
  {
    key: "amount",
    label: "Amount",
    sortable: true,
    render: (p) => <span className="font-medium">{Number(p.amount).toFixed(2)}</span>,
  },
  { key: "method", label: "Method" },
  {
    key: "paid_at",
    label: "Date",
    sortable: true,
    render: (p) =>
      p.paid_at ? format(new Date(p.paid_at), "MMM d, yyyy HH:mm") : "—",
  },
  {
    key: "status",
    label: "Status",
    render: (p) => (
      <StatusBadge status={p.status} variant={getStatusVariant(p.status)} />
    ),
  },
]

function RecordPaymentModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const createMutation = useCreatePayment()
  const { data: invoicesData } = useInvoices({ status: "pending", limit: 100 })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema) })

  const onSubmit = (values: PaymentForm) => {
    createMutation.mutate(
      {
        invoice_id: values.invoice_id,
        amount: values.amount,
        method: values.method,
        transaction_ref: values.transaction_ref || undefined,
      },
      { onSuccess: () => { reset(); onClose() } }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="invoice_id">Invoice *</Label>
            <select
              id="invoice_id"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("invoice_id")}
            >
              <option value="">Select pending invoice…</option>
              {invoicesData?.data.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  INV-{String(inv.id).padStart(4, "0")} — {Number(inv.total).toFixed(2)}
                </option>
              ))}
            </select>
            {errors.invoice_id && (
              <p className="text-xs text-destructive">{errors.invoice_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="method">Payment Method *</Label>
            <Input
              id="method"
              placeholder="Cash, Card, Bank Transfer…"
              {...register("method")}
            />
            {errors.method && (
              <p className="text-xs text-destructive">{errors.method.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transaction_ref">Transaction Reference</Label>
            <Input
              id="transaction_ref"
              placeholder="TXN-XXXXX (optional)"
              {...register("transaction_ref")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const PAGE_SIZE = 10

export default function PaymentsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)

  const { data, isLoading } = usePayments({
    page,
    limit: PAGE_SIZE,
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
        { value: "completed", label: "Completed" },
        { value: "failed", label: "Failed" },
        { value: "refunded", label: "Refunded" },
      ],
    },
  ]

  return (
    <DashboardLayout>
      <DataTable
        title="Payments"
        description="Track all payment transactions"
        columns={columns}
        data={data?.data ?? []}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        isLoading={isLoading}
        filters={filters}
        onAdd={() => setFormOpen(true)}
        addButtonLabel="Record Payment"
      />

      <RecordPaymentModal open={formOpen} onClose={() => setFormOpen(false)} />
    </DashboardLayout>
  )
}
