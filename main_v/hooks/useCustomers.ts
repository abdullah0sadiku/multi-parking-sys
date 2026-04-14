import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { customersService } from "@/lib/services/customers.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import type { CreateCustomerPayload, QueryParams, UpdateCustomerPayload } from "@/types"

export const CUSTOMERS_KEY = "customers"

export function useCustomers(params?: QueryParams) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, params],
    queryFn: () => customersService.getAll(params),
  })
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, id],
    queryFn: () => customersService.getById(id),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => customersService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      toast.success("Customer created successfully")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCustomerPayload }) =>
      customersService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      toast.success("Customer updated successfully")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => customersService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
      toast.success("Customer deleted")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}
