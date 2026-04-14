import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { paymentsService } from "@/lib/services/payments.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import type { CreatePaymentPayload, QueryParams } from "@/types"

export const PAYMENTS_KEY = "payments"

export function usePayments(params?: QueryParams) {
  return useQuery({
    queryKey: [PAYMENTS_KEY, params],
    queryFn: () => paymentsService.getAll(params),
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PAYMENTS_KEY] })
      qc.invalidateQueries({ queryKey: ["invoices"] })
      toast.success("Payment recorded")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}
