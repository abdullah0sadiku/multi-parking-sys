"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { parkingService } from "@/lib/services/parking.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import type { CreateParkingLevelPayload, QueryParams, UpdateParkingLevelPayload } from "@/types"

export const PARKING_KEY = "parking"

// ── Levels ────────────────────────────────────────────────────────────────────

export function useParkingLevels(params?: QueryParams) {
  return useQuery({
    queryKey: [PARKING_KEY, "levels", params],
    queryFn: () => parkingService.listLevels(params),
  })
}

export function useLevelSpots(levelId: number | null) {
  return useQuery({
    queryKey: [PARKING_KEY, "level-spots", levelId],
    queryFn: () => parkingService.getLevelSpots(levelId!),
    enabled: levelId != null,
  })
}

export function useCreateParkingLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateParkingLevelPayload) => parkingService.createLevel(payload),
    onSuccess: (level) => {
      qc.invalidateQueries({ queryKey: [PARKING_KEY] })
      toast.success(`Level "${level.name}" created with ${level.capacity} spots auto-generated`)
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateParkingLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateParkingLevelPayload }) =>
      parkingService.updateLevel(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PARKING_KEY] })
      toast.success("Level updated")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useDeleteParkingLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => parkingService.deleteLevel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PARKING_KEY] })
      toast.success("Level deleted")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useGenerateSpots() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (levelId: number) => parkingService.generateSpots(levelId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [PARKING_KEY] })
      toast.success(`Generated ${res.generated} new spots for ${res.level.name}`)
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

// ── Spots ─────────────────────────────────────────────────────────────────────

export function useUpdateSpotStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ spotId, status }: { spotId: number; status: "available" | "maintenance" }) =>
      parkingService.updateSpotStatus(spotId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PARKING_KEY] })
      toast.success("Spot status updated")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })
}

export function useRecommendSpot(excludeIds?: number[]) {
  return useQuery({
    queryKey: [PARKING_KEY, "recommend", excludeIds],
    queryFn: () => parkingService.recommendSpot(excludeIds),
    staleTime: 10_000, // re-fetch after 10s — availability changes frequently
  })
}
