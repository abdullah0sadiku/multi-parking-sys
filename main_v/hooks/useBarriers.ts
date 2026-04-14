import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { barriersService } from "@/lib/services/barriers.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import type { CreateBarrierPayload, QueryParams, UpdateBarrierPayload } from "@/types"

export const BARRIERS_KEY = "barriers"

export function useBarriers(params?: QueryParams) {
  return useQuery({
    queryKey: [BARRIERS_KEY, params],
    queryFn: () => barriersService.getAll(params),
  })
}

export function useCreateBarrier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBarrierPayload) => barriersService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BARRIERS_KEY] })
      toast.success("Barrier created")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateBarrier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateBarrierPayload }) =>
      barriersService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BARRIERS_KEY] })
      toast.success("Barrier updated")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useDeleteBarrier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => barriersService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BARRIERS_KEY] })
      toast.success("Barrier deleted")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}
