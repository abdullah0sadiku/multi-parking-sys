import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { subscriptionsService } from "@/lib/services/subscriptions.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import type { CreateSubscriptionPayload, QueryParams, UpdateSubscriptionPayload } from "@/types"

export const SUBSCRIPTIONS_KEY = "subscriptions"

export function useSubscriptions(params?: QueryParams) {
  return useQuery({
    queryKey: [SUBSCRIPTIONS_KEY, params],
    queryFn: () => subscriptionsService.getAll(params),
  })
}

export function useCreateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSubscriptionPayload) => subscriptionsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SUBSCRIPTIONS_KEY] })
      toast.success("Subscription created")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSubscriptionPayload }) =>
      subscriptionsService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SUBSCRIPTIONS_KEY] })
      toast.success("Subscription updated")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useDeleteSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => subscriptionsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SUBSCRIPTIONS_KEY] })
      toast.success("Subscription deleted")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useGenerateSubscriptionInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => subscriptionsService.generateInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] })
      toast.success("Invoice generated")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}
