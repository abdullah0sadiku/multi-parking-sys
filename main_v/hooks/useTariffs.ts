import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { tariffsService } from "@/lib/services/tariffs.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import type { CreateTariffPayload, QueryParams, UpdateTariffPayload } from "@/types"

export const TARIFFS_KEY = "tariffs"

export function useTariffs(params?: QueryParams) {
  return useQuery({
    queryKey: [TARIFFS_KEY, params],
    queryFn: () => tariffsService.getAll(params),
  })
}

export function useCreateTariff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTariffPayload) => tariffsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TARIFFS_KEY] })
      toast.success("Tariff created")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateTariff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTariffPayload }) =>
      tariffsService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TARIFFS_KEY] })
      toast.success("Tariff updated")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useDeleteTariff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => tariffsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TARIFFS_KEY] })
      toast.success("Tariff deleted")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}
