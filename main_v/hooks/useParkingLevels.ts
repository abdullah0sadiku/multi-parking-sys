import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { parkingLevelsService } from "@/lib/services/parkingLevels.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import type { CreateParkingLevelPayload, QueryParams, UpdateParkingLevelPayload } from "@/types"

export const PARKING_LEVELS_KEY = "parkingLevels"

export function useParkingLevels(params?: QueryParams) {
  return useQuery({
    queryKey: [PARKING_LEVELS_KEY, params],
    queryFn: () => parkingLevelsService.getAll(params),
  })
}

export function useCreateParkingLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateParkingLevelPayload) => parkingLevelsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PARKING_LEVELS_KEY] })
      toast.success("Parking level created")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateParkingLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateParkingLevelPayload }) =>
      parkingLevelsService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PARKING_LEVELS_KEY] })
      toast.success("Parking level updated")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useDeleteParkingLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => parkingLevelsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PARKING_LEVELS_KEY] })
      toast.success("Parking level deleted")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}
