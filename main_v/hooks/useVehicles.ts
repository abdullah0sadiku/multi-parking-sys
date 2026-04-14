import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { vehiclesService } from "@/lib/services/vehicles.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import type { CreateVehiclePayload, QueryParams, UpdateVehiclePayload } from "@/types"

export const VEHICLES_KEY = "vehicles"

export function useVehicles(params?: QueryParams) {
  return useQuery({
    queryKey: [VEHICLES_KEY, params],
    queryFn: () => vehiclesService.getAll(params),
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateVehiclePayload) => vehiclesService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [VEHICLES_KEY] })
      toast.success("Vehicle registered")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateVehiclePayload }) =>
      vehiclesService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [VEHICLES_KEY] })
      toast.success("Vehicle updated")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => vehiclesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [VEHICLES_KEY] })
      toast.success("Vehicle removed")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}
