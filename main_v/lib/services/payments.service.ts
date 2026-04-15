import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type {
  ApiResponse,
  CreatePaymentPayload,
  PaginatedResponse,
  Payment,
  QueryParams,
} from "@/types"

export const paymentsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<Payment>> => {
    const { data } = await axiosInstance.get(ENDPOINTS.PAYMENTS.LIST, { params })
    return { data: data.items, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
  },

  getById: async (id: number): Promise<Payment> => {
    const { data } = await axiosInstance.get<ApiResponse<Payment>>(
      ENDPOINTS.PAYMENTS.DETAIL(id)
    )
    return data.data
  },

  create: async (payload: CreatePaymentPayload): Promise<Payment> => {
    const { data } = await axiosInstance.post<ApiResponse<Payment>>(
      ENDPOINTS.PAYMENTS.LIST,
      payload
    )
    return data.data
  },
}
