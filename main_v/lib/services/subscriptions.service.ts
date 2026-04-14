import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type {
  ApiResponse,
  CreateSubscriptionPayload,
  Invoice,
  PaginatedResponse,
  QueryParams,
  Subscription,
  UpdateSubscriptionPayload,
} from "@/types"

export const subscriptionsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<Subscription>> => {
    const { data } = await axiosInstance.get(ENDPOINTS.SUBSCRIPTIONS.LIST, { params })
    return { data: data.items, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
  },

  getById: async (id: number): Promise<Subscription> => {
    const { data } = await axiosInstance.get<ApiResponse<Subscription>>(
      ENDPOINTS.SUBSCRIPTIONS.DETAIL(id)
    )
    return data.data
  },

  create: async (payload: CreateSubscriptionPayload): Promise<Subscription> => {
    const { data } = await axiosInstance.post<ApiResponse<Subscription>>(
      ENDPOINTS.SUBSCRIPTIONS.LIST,
      payload
    )
    return data.data
  },

  update: async (id: number, payload: UpdateSubscriptionPayload): Promise<Subscription> => {
    const { data } = await axiosInstance.patch<ApiResponse<Subscription>>(
      ENDPOINTS.SUBSCRIPTIONS.DETAIL(id),
      payload
    )
    return data.data
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.SUBSCRIPTIONS.DETAIL(id))
  },

  generateInvoice: async (id: number): Promise<Invoice> => {
    const { data } = await axiosInstance.post<ApiResponse<Invoice>>(
      ENDPOINTS.SUBSCRIPTIONS.GENERATE_INVOICE(id)
    )
    return data.data
  },
}
