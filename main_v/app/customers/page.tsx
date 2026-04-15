"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DataTable, Column } from "@/components/shared/data-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/useCustomers"
import type { Customer } from "@/types"
import { format } from "date-fns"

// ─── Validation schema ────────────────────────────────────────────────────────

const customerSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(64).optional().or(z.literal("")),
})

type CustomerForm = z.infer<typeof customerSchema>

// ─── Column definitions ───────────────────────────────────────────────────────

const columns: Column<Customer>[] = [
  {
    key: "full_name",
    label: "Customer",
    sortable: true,
    render: (c) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {c.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{c.full_name}</p>
          <p className="text-sm text-muted-foreground">{c.email ?? "—"}</p>
        </div>
      </div>
    ),
  },
  { key: "phone", label: "Phone", render: (c) => c.phone ?? "—" },
  {
    key: "created_at",
    label: "Joined",
    sortable: true,
    render: (c) => format(new Date(c.created_at), "MMM d, yyyy"),
  },
]

const PAGE_SIZE = 10

// ─── Customer form modal ──────────────────────────────────────────────────────

function CustomerFormModal({
  open,
  onClose,
  customer,
}: {
  open: boolean
  onClose: () => void
  customer: Customer | null
}) {
  const isEdit = !!customer
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const isPending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  })

  // Populate form whenever the modal opens or the target customer changes
  useEffect(() => {
    if (open) {
      reset({
        full_name: customer?.full_name ?? "",
        email:     customer?.email    ?? "",
        phone:     customer?.phone    ?? "",
      })
    }
  }, [open, customer, reset])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset()
      onClose()
    }
  }

  const onSubmit = (values: CustomerForm) => {
    const payload = {
      full_name: values.full_name,
      email: values.email || undefined,
      phone: values.phone || undefined,
    }
    if (isEdit && customer) {
      updateMutation.mutate(
        { id: customer.id, payload },
        { onSuccess: () => { reset(); onClose() } }
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => { reset(); onClose() } })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Customer" : "Add Customer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input id="full_name" placeholder="John Smith" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" placeholder="+1 234-567-8901" {...register("phone")} />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")

  // Modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const deleteMutation = useDeleteCustomer()

  const { data, isLoading } = useCustomers({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  })

  const handleAdd = () => {
    setEditTarget(null)
    setFormOpen(true)
  }

  const handleEdit = (c: Customer) => {
    setEditTarget(c)
    setFormOpen(true)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
  }

  return (
    <DashboardLayout>
      <DataTable
        title="Customers"
        description="Manage customer accounts and their information"
        columns={columns}
        data={data?.data ?? []}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        isLoading={isLoading}
        searchPlaceholder="Search by name, email…"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        addButtonLabel="Add Customer"
      />

      {/* Create / Edit modal */}
      <CustomerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        customer={editTarget}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.full_name}</strong> and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
