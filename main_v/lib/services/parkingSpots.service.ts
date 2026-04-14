import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type {
  ApiResponse,
  CreateParkingSpotPayload,
  PaginatedResponse,
  ParkingSpot,
  QueryParams,
  UpdateParkingSpotPayload,
} from "@/types"

export const parkingSpotsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<ParkingSpot>> => {
    const { data } = await axiosInstance.get(ENDPOINTS.PARKING_SPOTS.LIST, { params })
    return { data: data.items, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
  },

  getById: async (id: number): Promise<ParkingSpot> => {
    const { data } = await axiosInstance.get<ApiResponse<ParkingSpot>>(
      ENDPOINTS.PARKING_SPOTS.DETAIL(id)
    )
    return data.data
  },

  create: async (payload: CreateParkingSpotPayload): Promise<ParkingSpot> => {
    const { data } = await axiosInstance.post<ApiResponse<ParkingSpot>>(
      ENDPOINTS.PARKING_SPOTS.LIST,
      payload
    )
    return data.data
  },

  update: async (id: number, payload: UpdateParkingSpotPayload): Promise<ParkingSpot> => {
    const { data } = await axiosInstance.patch<ApiResponse<ParkingSpot>>(
      ENDPOINTS.PARKING_SPOTS.DETAIL(id),
      payload
    )
    return data.data
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.PARKING_SPOTS.DETAIL(id))
  },
}
