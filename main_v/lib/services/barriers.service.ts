import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type {
  ApiResponse,
  Barrier,
  CreateBarrierPayload,
  PaginatedResponse,
  QueryParams,
  UpdateBarrierPayload,
} from "@/types"

export const barriersService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<Barrier>> => {
    const { data } = await axiosInstance.get(ENDPOINTS.BARRIERS.LIST, { params })
    return { data: data.items, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
  },

  getById: async (id: number): Promise<Barrier> => {
    const { data } = await axiosInstance.get<ApiResponse<Barrier>>(
      ENDPOINTS.BARRIERS.DETAIL(id)
    )
    return data.data
  },

  create: async (payload: CreateBarrierPayload): Promise<Barrier> => {
    const { data } = await axiosInstance.post<ApiResponse<Barrier>>(
      ENDPOINTS.BARRIERS.LIST,
      payload
    )
    return data.data
  },

  update: async (id: number, payload: UpdateBarrierPayload): Promise<Barrier> => {
    const { data } = await axiosInstance.patch<ApiResponse<Barrier>>(
      ENDPOINTS.BARRIERS.DETAIL(id),
      payload
    )
    return data.data
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.BARRIERS.DETAIL(id))
  },
}
