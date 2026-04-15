import { axiosInstance } from "@/lib/api/axiosInstance"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type {
  AuthResponse,
  CustomerRegisterPayload,
  PortalInvoice,
  PortalProfile,
  PortalSession,
  PortalSpot,
  PortalSubscription,
  PortalTariff,
  PortalVehicle,
} from "@/types"

function unwrap<T>(response: { data: { success: boolean; data: T } }): T {
  return response.data.data
}

export const portalService = {
  // ── Auth ────────────────────────────────────────────────────────────────────

  register: async (payload: CustomerRegisterPayload): Promise<AuthResponse> => {
    const res = await axiosInstance.post(ENDPOINTS.PORTAL.REGISTER, payload)
    return res.data.data as AuthResponse
  },

  // ── Profile ──────────────────────────────────────────────────────────────────

  getProfile: async (): Promise<PortalProfile> =>
    unwrap(await axiosInstance.get(ENDPOINTS.PORTAL.PROFILE)),

  updateProfile: async (payload: { full_name?: string; phone?: string }): Promise<PortalProfile> =>
    unwrap(await axiosInstance.patch(ENDPOINTS.PORTAL.PROFILE, payload)),

  // ── Vehicles ─────────────────────────────────────────────────────────────────

  getVehicles: async (): Promise<PortalVehicle[]> => {
    const res = await axiosInstance.get(ENDPOINTS.PORTAL.VEHICLES)
    return res.data.data as PortalVehicle[]
  },

  addVehicle: async (payload: { license_plate: string; vehicle_type?: string }): Promise<PortalVehicle> =>
    unwrap(await axiosInstance.post(ENDPOINTS.PORTAL.VEHICLES, payload)),

  updateVehicle: async (id: number, payload: { license_plate?: string; vehicle_type?: string }): Promise<PortalVehicle> =>
    unwrap(await axiosInstance.patch(ENDPOINTS.PORTAL.VEHICLE(id), payload)),

  deleteVehicle: async (id: number): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.PORTAL.VEHICLE(id))
  },

  // ── Spots ─────────────────────────────────────────────────────────────────────

  getAvailableSpots: async (): Promise<PortalSpot[]> => {
    const res = await axiosInstance.get(ENDPOINTS.PORTAL.SPOTS_AVAILABLE)
    return res.data.data as PortalSpot[]
  },

  // ── Tariffs ───────────────────────────────────────────────────────────────────

  getTariffs: async (): Promise<PortalTariff[]> => {
    const res = await axiosInstance.get(ENDPOINTS.PORTAL.TARIFFS)
    return res.data.data as PortalTariff[]
  },

  // ── Subscriptions ─────────────────────────────────────────────────────────────

  getSubscriptions: async (): Promise<PortalSubscription[]> => {
    const res = await axiosInstance.get(ENDPOINTS.PORTAL.SUBSCRIPTIONS)
    return res.data.data as PortalSubscription[]
  },

  subscribe: async (payload: {
    vehicle_id: number
    spot_id?: number | null
    tariff_id?: number | null
    valid_from: string
    valid_to: string
    monthly_fee?: number | null
  }): Promise<PortalSubscription> =>
    unwrap(await axiosInstance.post(ENDPOINTS.PORTAL.SUBSCRIPTIONS, payload)),

  cancelSubscription: async (id: number): Promise<PortalSubscription> =>
    unwrap(await axiosInstance.patch(ENDPOINTS.PORTAL.SUBSCRIPTION_CANCEL(id))),

  // ── Sessions ──────────────────────────────────────────────────────────────────

  getSessions: async (): Promise<PortalSession[]> => {
    const res = await axiosInstance.get(ENDPOINTS.PORTAL.SESSIONS)
    return res.data.data as PortalSession[]
  },

  // ── Invoices ──────────────────────────────────────────────────────────────────

  getInvoices: async (): Promise<PortalInvoice[]> => {
    const res = await axiosInstance.get(ENDPOINTS.PORTAL.INVOICES)
    return res.data.data as PortalInvoice[]
  },

  payInvoice: async (id: number, payload: {
    cardholder_name: string
    card_last4: string
    card_brand: string
  }): Promise<{ transaction_ref: string }> => {
    const res = await axiosInstance.post(ENDPOINTS.PORTAL.INVOICE_PAY(id), payload)
    return res.data.data
  },

  downloadInvoice: async (id: number): Promise<void> => {
    const res = await axiosInstance.get(ENDPOINTS.PORTAL.INVOICE_DOWNLOAD(id), {
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
