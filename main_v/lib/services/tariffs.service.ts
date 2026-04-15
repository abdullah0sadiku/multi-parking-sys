import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type {
  ApiResponse,
  CreateTariffPayload,
  PaginatedResponse,
  QueryParams,
  Tariff,
  UpdateTariffPayload,
} from "@/types"

export const tariffsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<Tariff>> => {
    const { data } = await axiosInstance.get(ENDPOINTS.TARIFFS.LIST, { params })
    return { data: data.items, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
  },

  getById: async (id: number): Promise<Tariff> => {
    const { data } = await axiosInstance.get<ApiResponse<Tariff>>(
      ENDPOINTS.TARIFFS.DETAIL(id)
    )
    return data.data
  },

  create: async (payload: CreateTariffPayload): Promise<Tariff> => {
    const { data } = await axiosInstance.post<ApiResponse<Tariff>>(
      ENDPOINTS.TARIFFS.LIST,
      payload
    )
    return data.data
  },

  update: async (id: number, payload: UpdateTariffPayload): Promise<Tariff> => {
    const { data } = await axiosInstance.patch<ApiResponse<Tariff>>(
      ENDPOINTS.TARIFFS.DETAIL(id),
      payload
    )
    return data.data
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.TARIFFS.DETAIL(id))
  },
}
