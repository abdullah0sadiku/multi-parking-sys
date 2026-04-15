import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type {
  ApiResponse,
  CreateParkingLevelPayload,
  PaginatedResponse,
  ParkingLevel,
  QueryParams,
  UpdateParkingLevelPayload,
} from "@/types"

export const parkingLevelsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<ParkingLevel>> => {
    const { data } = await axiosInstance.get(ENDPOINTS.PARKING_LEVELS.LIST, { params })
    return { data: data.items, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
  },

  getById: async (id: number): Promise<ParkingLevel> => {
    const { data } = await axiosInstance.get<ApiResponse<ParkingLevel>>(
      ENDPOINTS.PARKING_LEVELS.DETAIL(id)
    )
    return data.data
  },

  create: async (payload: CreateParkingLevelPayload): Promise<ParkingLevel> => {
    const { data } = await axiosInstance.post<ApiResponse<ParkingLevel>>(
      ENDPOINTS.PARKING_LEVELS.LIST,
      payload
    )
    return data.data
  },

  update: async (id: number, payload: UpdateParkingLevelPayload): Promise<ParkingLevel> => {
    const { data } = await axiosInstance.patch<ApiResponse<ParkingLevel>>(
      ENDPOINTS.PARKING_LEVELS.DETAIL(id),
      payload
    )
    return data.data
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.PARKING_LEVELS.DETAIL(id))
  },
}
