"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, ShieldCheck } from "lucide-react"
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
  DialogDescription,
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
import { useUsers, useUpdateUserRole, useDeleteUser } from "@/hooks/useUsers"
import { authService } from "@/lib/services/auth.service"
import { customersService } from "@/lib/services/customers.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import { CUSTOMERS_KEY } from "@/hooks/useCustomers"
import { format } from "date-fns"
import type { User } from "@/types"

// ─── Schema ───────────────────────────────────────────────────────────────────

const createUserSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "staff"]),
})

const editRoleSchema = z.object({
  role: z.enum(["admin", "staff"]),
})

type CreateUserForm = z.infer<typeof createUserSchema>
type EditRoleForm = z.infer<typeof editRoleSchema>

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const styles =
    role === "admin"
      ? "bg-primary/15 text-primary border-primary/30"
      : "bg-muted text-muted-foreground border-border"
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}
    >
      <ShieldCheck className="h-3 w-3" />
      {role}
    </span>
  )
}

// ─── Create user modal ────────────────────────────────────────────────────────

function CreateUserModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "staff" },
  })

  // Single mutation that chains register → create customer
  const { mutate, isPending } = useMutation({
    mutationFn: async (values: CreateUserForm) => {
      // 1. Create the auth user account
      await authService.register({
        email: values.email,
        password: values.password,
        role: values.role,
      })
      // 2. Automatically create a matching Customer record
      await customersService.create({
        full_name: values.full_name,
        email: values.email,
      })
    },
    onSuccess: () => {
      toast.success("User registered and customer profile created")
      // Refresh both users and customers lists
      qc.invalidateQueries({ queryKey: ["users"] })
      qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      reset()
      onClose()
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register New User</DialogTitle>
          <DialogDescription>
            Creating a user also creates a linked Customer profile, making them
            available in Vehicles, Sessions, and Subscriptions immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input id="full_name" placeholder="Jane Smith" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" placeholder="jane@example.com" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password *</Label>
            <Input id="password" type="password" placeholder="Min. 6 characters" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role">Role *</Label>
            <select
              id="role"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("role")}
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            A customer profile will be created automatically with the same name and
            email, so this user is immediately selectable under Vehicles, Sessions,
            and Subscriptions.
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit role modal ──────────────────────────────────────────────────────────

function EditRoleModal({
  user,
  onClose,
}: {
  user: User | null
  onClose: () => void
}) {
  const updateRole = useUpdateUserRole()

  const { register, handleSubmit, formState: { errors } } = useForm<EditRoleForm>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: { role: (user?.role === "admin" ? "admin" : "staff") as "admin" | "staff" },
  })

  const onSubmit: (values: EditRoleForm) => void = (values) => {
    if (!user) return
    updateRole.mutate(
      { id: user.id, role: values.role },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit_role">Role</Label>
            <select
              id="edit_role"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("role")}
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={updateRole.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateRole.isPending}>
              {updateRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Columns ─────────────────────────────────────────────────────────────────

const columns: Column<User>[] = [
  {
    key: "email",
    label: "User",
    render: (u) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {u.email.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium">{u.email}</span>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role",
    render: (u) => <RoleBadge role={u.role} />,
  },
  {
    key: "created_at",
    label: "Registered",
    sortable: true,
    render: (u) => format(new Date(u.created_at), "MMM d, yyyy"),
  },
]

const PAGE_SIZE = 10

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const deleteMutation = useDeleteUser()

  const { data, isLoading } = useUsers({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
  })

  const filters = [
    {
      key: "role",
      label: "Role",
      value: roleFilter,
      onChange: (v: string) => { setRoleFilter(v); setPage(1) },
      options: [
        { value: "all", label: "All Roles" },
        { value: "admin", label: "Admin" },
        { value: "staff", label: "Staff" },
      ],
    },
  ]

  return (
    <DashboardLayout>
      <DataTable
        title="Users & Roles"
        description="System accounts — each user gets a linked customer profile automatically"
        columns={columns}
        data={data?.data ?? []}
        total={data?.total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        isLoading={isLoading}
        searchPlaceholder="Search by email…"
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        filters={filters}
        onAdd={() => setCreateOpen(true)}
        onEdit={(u) => setEditTarget(u)}
        onDelete={(u) => setDeleteTarget(u)}
        addButtonLabel="Register User"
      />

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditRoleModal user={editTarget} onClose={() => setEditTarget(null)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleteTarget?.email}</strong>? This cannot be undone.
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
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
