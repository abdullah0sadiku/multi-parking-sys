import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { sessionsService } from "@/lib/services/sessions.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import type { CreateSessionPayload, QueryParams } from "@/types"

export const SESSIONS_KEY = "sessions"

export function useSessions(params?: QueryParams) {
  return useQuery({
    queryKey: [SESSIONS_KEY, params],
    queryFn: () => sessionsService.getAll(params),
  })
}

export function useSession(id: number) {
  return useQuery({
    queryKey: [SESSIONS_KEY, id],
    queryFn: () => sessionsService.getById(id),
    enabled: !!id,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSessionPayload) => sessionsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SESSIONS_KEY] })
      toast.success("Session started")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useEndSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sessionsService.end(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SESSIONS_KEY] })
      toast.success("Session ended — invoice generated")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useMarkSessionPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, method }: { id: number; method: "POS" | "Cash" | "Card" }) =>
      sessionsService.pay(id, method),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SESSIONS_KEY] })
      toast.success("Payment recorded — invoice marked as paid")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}
