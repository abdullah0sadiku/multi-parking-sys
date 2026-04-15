import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type {
  ApiResponse,
  CreateParkingLevelPayload,
  LevelWithSpots,
  PaginatedResponse,
  ParkingLevel,
  ParkingSpot,
  QueryParams,
  UpdateParkingLevelPayload,
} from "@/types"

export const parkingService = {
  // ── Levels ────────────────────────────────────────────────────────────────

  listLevels: async (params?: QueryParams): Promise<PaginatedResponse<ParkingLevel>> => {
    const { data } = await axiosInstance.get(ENDPOINTS.PARKING.LIST, { params })
    return { data: data.items, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
  },

  getLevelSpots: async (levelId: number): Promise<LevelWithSpots> => {
    const { data } = await axiosInstance.get<ApiResponse<LevelWithSpots>>(
      ENDPOINTS.PARKING.SPOTS(levelId)
    )
    return data.data
  },

  createLevel: async (payload: CreateParkingLevelPayload): Promise<ParkingLevel> => {
    const { data } = await axiosInstance.post<ApiResponse<ParkingLevel>>(
      ENDPOINTS.PARKING.LIST,
      payload
    )
    return data.data
  },

  updateLevel: async (levelId: number, payload: UpdateParkingLevelPayload): Promise<ParkingLevel> => {
    const { data } = await axiosInstance.patch<ApiResponse<ParkingLevel>>(
      ENDPOINTS.PARKING.DETAIL(levelId),
      payload
    )
    return data.data
  },

  deleteLevel: async (levelId: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.PARKING.DETAIL(levelId))
  },

  generateSpots: async (levelId: number): Promise<{ level: ParkingLevel; generated: number }> => {
    const { data } = await axiosInstance.post<ApiResponse<{ level: ParkingLevel; generated: number }>>(
      ENDPOINTS.PARKING.GENERATE_SPOTS(levelId)
    )
    return data.data
  },

  // ── Spots ─────────────────────────────────────────────────────────────────

  updateSpotStatus: async (spotId: number, status: "available" | "maintenance"): Promise<ParkingSpot> => {
    const { data } = await axiosInstance.patch<ApiResponse<ParkingSpot>>(
      ENDPOINTS.PARKING.UPDATE_SPOT(spotId),
      { status }
    )
    return data.data
  },

  recommendSpot: async (excludeIds?: number[]): Promise<ParkingSpot[]> => {
    const params = excludeIds?.length ? { exclude: excludeIds.join(",") } : undefined
    const { data } = await axiosInstance.get<ApiResponse<ParkingSpot[]>>(
      ENDPOINTS.PARKING.RECOMMEND_SPOT,
      { params }
    )
    return data.data
  },
}
