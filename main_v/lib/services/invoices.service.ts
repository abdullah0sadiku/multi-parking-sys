import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { ApiResponse, Invoice, PaginatedResponse, QueryParams } from "@/types"

export const invoicesService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<Invoice>> => {
    const { data } = await axiosInstance.get(ENDPOINTS.INVOICES.LIST, { params })
    return { data: data.items, total: data.meta.total, page: data.meta.page, limit: data.meta.limit }
  },

  getById: async (id: number): Promise<Invoice> => {
    const { data } = await axiosInstance.get<ApiResponse<Invoice>>(
      ENDPOINTS.INVOICES.DETAIL(id)
    )
    return data.data
  },

  download: async (id: number): Promise<void> => {
    const res = await axiosInstance.get(ENDPOINTS.INVOICES.DOWNLOAD(id), {
      responseType: "blob",
    })
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `INV-${String(id).padStart(4, "0")}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  },
}
