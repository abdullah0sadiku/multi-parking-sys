import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { ApiResponse, PaginatedResponse, QueryParams, User } from "@/types"

export const usersService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<User>> => {
    const { data } = await axiosInstance.get(ENDPOINTS.USERS.LIST, { params })
    return { data: data.items, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
  },

  getById: async (id: number): Promise<User> => {
    const { data } = await axiosInstance.get<ApiResponse<User>>(ENDPOINTS.USERS.DETAIL(id))
    return data.data
  },

  update: async (id: number, payload: { role: "admin" | "staff" }): Promise<User> => {
    const { data } = await axiosInstance.patch<ApiResponse<User>>(
      ENDPOINTS.USERS.DETAIL(id),
      payload
    )
    return data.data
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.USERS.DETAIL(id))
  },
}
