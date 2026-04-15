import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { parkingSpotsService } from "@/lib/services/parkingSpots.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import type { CreateParkingSpotPayload, QueryParams, UpdateParkingSpotPayload } from "@/types"

export const PARKING_SPOTS_KEY = "parkingSpots"

export function useParkingSpots(params?: QueryParams) {
  return useQuery({
    queryKey: [PARKING_SPOTS_KEY, params],
    queryFn: () => parkingSpotsService.getAll(params),
  })
}

export function useCreateParkingSpot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateParkingSpotPayload) => parkingSpotsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PARKING_SPOTS_KEY] })
      toast.success("Parking spot created")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateParkingSpot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateParkingSpotPayload }) =>
      parkingSpotsService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PARKING_SPOTS_KEY] })
      toast.success("Parking spot updated")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useDeleteParkingSpot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => parkingSpotsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PARKING_SPOTS_KEY] })
      toast.success("Parking spot deleted")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}
