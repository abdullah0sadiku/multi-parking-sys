import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { ApiResponse, AuthResponse, LoginPayload, RegisterPayload, User } from "@/types"

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<ApiResponse<AuthResponse>>(
      ENDPOINTS.AUTH.LOGIN,
      payload
    )
    return data.data
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<ApiResponse<AuthResponse>>(
      ENDPOINTS.AUTH.REGISTER,
      payload
    )
    return data.data
  },

  me: async (): Promise<User> => {
    const { data } = await axiosInstance.get<ApiResponse<User>>(ENDPOINTS.AUTH.ME)
    return data.data
  },
}
