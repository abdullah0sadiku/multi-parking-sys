import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { usersService } from "@/lib/services/users.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import type { QueryParams } from "@/types"

export const USERS_KEY = "users"

export function useUsers(params?: QueryParams) {
  return useQuery({
    queryKey: [USERS_KEY, params],
    queryFn: () => usersService.getAll(params),
  })
}

export function useUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: "admin" | "staff" }) =>
      usersService.update(id, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success("Role updated")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => usersService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success("User removed")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}
