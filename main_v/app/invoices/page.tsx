"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DataTable, Column } from "@/components/shared/data-table"
import { StatusBadge, getStatusVariant } from "@/components/shared/status-badge"
import { useInvoices } from "@/hooks/useInvoices"
import type { Invoice } from "@/types"
import { format } from "date-fns"
import { Download, Loader2 } from "lucide-react"
import { invoicesService } from "@/lib/services/invoices.service"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"

function DownloadButton({ id }: { id: number }) {
  const [loading, setLoading] = useState(false)
  const handle = async () => {
    setLoading(true)
    try {
      await invoicesService.download(id)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }
  return (
    <button
      onClick={handle}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50"
      title="Download PDF"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      PDF
    </button>
  )
}

const columns: Column<Invoice>[] = [
  {
    key: "id",
    label: "Invoice #",
    sortable: true,
    render: (inv) => (
      <span className="font-mono text-sm font-medium text-primary">
        INV-{String(inv.id).padStart(4, "0")}
      </span>
    ),
  },
  {
    key: "customer_name",
    label: "Customer",
    render: (inv) => inv.customer_name ?? "—",
  },
  {
    key: "total",
    label: "Total",
    sortable: true,
    render: (inv) => (
      <span className="font-medium">
        {Number(inv.total).toFixed(2)}
      </span>
    ),
  },
  {
    key: "issued_at",
    label: "Issued",
    sortable: true,
    render: (inv) => format(new Date(inv.issued_at), "MMM d, yyyy"),
  },
  {
    key: "due_at",
    label: "Due Date",
    render: (inv) =>
      inv.due_at ? format(new Date(inv.due_at), "MMM d, yyyy") : "—",
  },
  {
    key: "status",
    label: "Status",
    render: (inv) => (
      <StatusBadge status={inv.status} variant={getStatusVariant(inv.status)} />
    ),
  },
  {
    key: "download",
    label: "",
    render: (inv) => <DownloadButton id={inv.id} />,
  },
]

const PAGE_SIZE = 10

export default function InvoicesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { data, isLoading } = useInvoices({
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
        { value: "pending", label: "Pending" },
        { value: "paid", label: "Paid" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
  ]

  return (
    <DashboardLayout>
      <DataTable
        title="Invoices"
        description="View and manage billing invoices"
        columns={columns}
        data={data?.data ?? []}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        isLoading={isLoading}
        searchPlaceholder="Search invoices…"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        filters={filters}
      />
    </DashboardLayout>
  )
}
