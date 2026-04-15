import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type {
  ApiResponse,
  CreateVehiclePayload,
  PaginatedResponse,
  QueryParams,
  UpdateVehiclePayload,
  Vehicle,
} from "@/types"

export const vehiclesService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<Vehicle>> => {
    const { data } = await axiosInstance.get(ENDPOINTS.VEHICLES.LIST, { params })
    return { data: data.items, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
  },

  getById: async (id: number): Promise<Vehicle> => {
    const { data } = await axiosInstance.get<ApiResponse<Vehicle>>(
      ENDPOINTS.VEHICLES.DETAIL(id)
    )
    return data.data
  },

  create: async (payload: CreateVehiclePayload): Promise<Vehicle> => {
    const { data } = await axiosInstance.post<ApiResponse<Vehicle>>(
      ENDPOINTS.VEHICLES.LIST,
      payload
    )
    return data.data
  },

  update: async (id: number, payload: UpdateVehiclePayload): Promise<Vehicle> => {
    const { data } = await axiosInstance.patch<ApiResponse<Vehicle>>(
      ENDPOINTS.VEHICLES.DETAIL(id),
      payload
    )
    return data.data
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.VEHICLES.DETAIL(id))
  },
}
