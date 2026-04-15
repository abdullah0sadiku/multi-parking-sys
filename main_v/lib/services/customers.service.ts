import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type {
  ApiResponse,
  CreateCustomerPayload,
  Customer,
  PaginatedResponse,
  QueryParams,
  UpdateCustomerPayload,
} from "@/types"

export const customersService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<Customer>> => {
    const { data } = await axiosInstance.get(ENDPOINTS.CUSTOMERS.LIST, { params })
    return { data: data.items, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
  },

  getById: async (id: number): Promise<Customer> => {
    const { data } = await axiosInstance.get<ApiResponse<Customer>>(
      ENDPOINTS.CUSTOMERS.DETAIL(id)
    )
    return data.data
  },

  create: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const { data } = await axiosInstance.post<ApiResponse<Customer>>(
      ENDPOINTS.CUSTOMERS.LIST,
      payload
    )
    return data.data
  },

  update: async (id: number, payload: UpdateCustomerPayload): Promise<Customer> => {
    const { data } = await axiosInstance.patch<ApiResponse<Customer>>(
      ENDPOINTS.CUSTOMERS.DETAIL(id),
      payload
    )
    return data.data
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.CUSTOMERS.DETAIL(id))
  },
}
