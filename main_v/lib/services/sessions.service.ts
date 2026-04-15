import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type {
  ApiResponse,
  CreateSessionPayload,
  PaginatedResponse,
  ParkingSession,
  QueryParams,
} from "@/types"

export const sessionsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<ParkingSession>> => {
    const { data } = await axiosInstance.get(ENDPOINTS.SESSIONS.LIST, { params })
    return { data: data.items, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
  },

  getById: async (id: number): Promise<ParkingSession> => {
    const { data } = await axiosInstance.get<ApiResponse<ParkingSession>>(
      ENDPOINTS.SESSIONS.DETAIL(id)
    )
    return data.data
  },

  create: async (payload: CreateSessionPayload): Promise<ParkingSession> => {
    const { data } = await axiosInstance.post<ApiResponse<ParkingSession>>(
      ENDPOINTS.SESSIONS.LIST,
      payload
    )
    return data.data
  },

  end: async (id: number): Promise<ParkingSession> => {
    const { data } = await axiosInstance.patch<ApiResponse<ParkingSession>>(
      ENDPOINTS.SESSIONS.END(id)
    )
    return data.data
  },

  pay: async (id: number, method: "POS" | "Cash" | "Card"): Promise<{ transaction_ref: string }> => {
    const { data } = await axiosInstance.post(ENDPOINTS.SESSIONS.PAY(id), { method })
    return data.data
  },
}
