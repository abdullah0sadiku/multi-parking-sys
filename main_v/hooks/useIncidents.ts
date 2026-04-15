import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { incidentsService } from "@/lib/services/incidents.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import type { CreateIncidentPayload, QueryParams, UpdateIncidentPayload } from "@/types"

export const INCIDENTS_KEY = "incidents"

export function useIncidents(params?: QueryParams) {
  return useQuery({
    queryKey: [INCIDENTS_KEY, params],
    queryFn: () => incidentsService.getAll(params),
  })
}

export function useCreateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateIncidentPayload) => incidentsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INCIDENTS_KEY] })
      toast.success("Incident reported")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateIncidentPayload }) =>
      incidentsService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INCIDENTS_KEY] })
      toast.success("Incident updated")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useDeleteIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => incidentsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INCIDENTS_KEY] })
      toast.success("Incident deleted")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}
