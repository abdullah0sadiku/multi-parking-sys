import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type {
  ApiResponse,
  CreateIncidentPayload,
  Incident,
  PaginatedResponse,
  QueryParams,
  UpdateIncidentPayload,
} from "@/types"

export const incidentsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<Incident>> => {
    const { data } = await axiosInstance.get(ENDPOINTS.INCIDENTS.LIST, { params })
    return { data: data.items, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
  },

  getById: async (id: number): Promise<Incident> => {
    const { data } = await axiosInstance.get<ApiResponse<Incident>>(
      ENDPOINTS.INCIDENTS.DETAIL(id)
    )
    return data.data
  },

  create: async (payload: CreateIncidentPayload): Promise<Incident> => {
    const { data } = await axiosInstance.post<ApiResponse<Incident>>(
      ENDPOINTS.INCIDENTS.LIST,
      payload
    )
    return data.data
  },

  update: async (id: number, payload: UpdateIncidentPayload): Promise<Incident> => {
    const { data } = await axiosInstance.patch<ApiResponse<Incident>>(
      ENDPOINTS.INCIDENTS.DETAIL(id),
      payload
    )
    return data.data
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.INCIDENTS.DETAIL(id))
  },
}
