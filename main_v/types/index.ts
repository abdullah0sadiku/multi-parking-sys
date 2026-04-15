// ─── Shared ───────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface QueryParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: string | number | boolean | undefined
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "staff" | "customer"

export interface User {
  id: number
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

// Shape returned by POST /api/auth/login  →  { success, data: { token, user } }
export interface AuthResponse {
  token: string
  user: {
    id: number
    email: string
    role: UserRole
  }
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  role?: "admin" | "staff"
}

export interface CustomerRegisterPayload {
  full_name: string
  email: string
  password: string
  phone?: string
}

// Customer portal data types
export interface PortalVehicle {
  id: number
  customer_id: number
  license_plate: string
  vehicle_type: string | null
  created_at: string
  updated_at: string
}

export interface PortalSpot {
  id: number
  level_id: number
  spot_code: string
  status: string
  level_name: string
  floor_number: number
}

export interface PortalTariff {
  id: number
  name: string
  rate_per_hour: number
  vat_percent: number
  currency: string
}

export interface PortalSubscription {
  id: number
  customer_id: number
  vehicle_id: number
  spot_id: number | null
  tariff_id: number | null
  valid_from: string
  valid_to: string
  status: string
  monthly_fee: number | null
  license_plate: string
  spot_code: string | null
  level_name: string | null
  tariff_name: string | null
}

export interface PortalSession {
  id: number
  vehicle_id: number
  spot_id: number
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  status: string
  license_plate: string
  spot_code: string
  level_name: string
  tariff_name: string | null
}

export interface PortalInvoice {
  id: number
  parking_session_id: number | null
  subscription_id: number | null
  subtotal: number
  vat_rate: number
  vat_amount: number
  total: number
  status: string
  issued_at: string
  due_at: string | null
}

export interface PortalProfile {
  id: number
  full_name: string
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

// ─── Parking Levels ───────────────────────────────────────────────────────────

export interface ParkingLevel {
  id: number
  name: string
  prefix: string
  floor_number: number
  capacity: number
  description: string | null
  created_at: string
  updated_at: string
  // aggregated spot stats (from unified /api/parking)
  total_spots?: number
  available_spots?: number
  occupied_spots?: number
  reserved_spots?: number
  maintenance_spots?: number
}

export interface CreateParkingLevelPayload {
  name: string
  prefix: string
  floor_number: number
  capacity: number
  description?: string
}

export type UpdateParkingLevelPayload = Partial<CreateParkingLevelPayload>

// ─── Unified Parking (level + its spots) ─────────────────────────────────────

export interface LevelWithSpots {
  level: ParkingLevel
  spots: ParkingSpot[]
}

// ─── Parking Spots ────────────────────────────────────────────────────────────

export type SpotStatus = "available" | "occupied" | "reserved" | "maintenance"

export interface ParkingSpot {
  id: number
  level_id: number
  spot_code: string
  status: SpotStatus
  created_at: string
  updated_at: string
  // joined fields
  level_name?: string
}

export interface CreateParkingSpotPayload {
  level_id: number
  spot_code: string
  status?: SpotStatus
}

export type UpdateParkingSpotPayload = Partial<CreateParkingSpotPayload>

// ─── Customers ────────────────────────────────────────────────────────────────

export interface Customer {
  id: number
  full_name: string
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface CreateCustomerPayload {
  full_name: string
  email?: string
  phone?: string
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: number
  customer_id: number
  license_plate: string
  vehicle_type: string | null
  created_at: string
  updated_at: string
  // joined
  customer_name?: string
}

export interface CreateVehiclePayload {
  customer_id: number
  license_plate: string
  vehicle_type?: string
}

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>

// ─── Tariffs ──────────────────────────────────────────────────────────────────

export interface Tariff {
  id: number
  name: string
  rate_per_hour: number
  vat_percent: number
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateTariffPayload {
  name: string
  rate_per_hour: number
  vat_percent?: number
  currency?: string
  is_active?: boolean
}

export type UpdateTariffPayload = Partial<CreateTariffPayload>

// ─── Parking Sessions ─────────────────────────────────────────────────────────

export type SessionStatus = "active" | "completed" | "cancelled"

export interface ParkingSession {
  id: number
  vehicle_id: number
  spot_id: number | null
  tariff_id: number | null
  subscription_id: number | null
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  status: SessionStatus
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  license_plate?: string
  spot_code?: string
  level_name?: string
  customer_name?: string
  tariff_name?: string
  rate_per_hour?: number
  // invoice joined from list query
  invoice_id?: number | null
  invoice_status?: string | null
  invoice_total?: number | null
}

export interface CreateSessionPayload {
  license_plate: string
  spot_id?: number
  tariff_id?: number
  notes?: string
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export type SubscriptionStatus = "active" | "expired" | "cancelled"

export interface Subscription {
  id: number
  customer_id: number
  vehicle_id: number
  spot_id: number | null
  tariff_id: number | null
  valid_from: string
  valid_to: string
  status: SubscriptionStatus
  monthly_fee: number | null
  auto_invoice: boolean
  created_at: string
  updated_at: string
  // joined
  customer_name?: string
  license_plate?: string
  spot_code?: string
  tariff_name?: string
}

export interface CreateSubscriptionPayload {
  customer_id: number
  vehicle_id: number
  spot_id?: number
  tariff_id?: number
  valid_from: string
  valid_to: string
  status?: SubscriptionStatus
  monthly_fee?: number
  auto_invoice?: boolean
}

export type UpdateSubscriptionPayload = Partial<CreateSubscriptionPayload>

// ─── Invoices ─────────────────────────────────────────────────────────────────

export type InvoiceStatus = "pending" | "paid" | "cancelled"

export interface Invoice {
  id: number
  parking_session_id: number | null
  subscription_id: number | null
  subtotal: number
  vat_rate: number
  vat_amount: number
  total: number
  status: InvoiceStatus
  issued_at: string
  due_at: string | null
  created_at: string
  updated_at: string
  // joined
  customer_name?: string
  invoice_number?: string
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export type PaymentStatus = "completed" | "failed" | "refunded"

export interface Payment {
  id: number
  invoice_id: number
  amount: number
  method: string
  transaction_ref: string | null
  paid_at: string | null
  status: PaymentStatus
  created_at: string
  // joined
  customer_name?: string
}

export interface CreatePaymentPayload {
  invoice_id: number
  amount: number
  method: string
  transaction_ref?: string
  paid_at?: string
  status?: PaymentStatus
}

// ─── Barriers ─────────────────────────────────────────────────────────────────

export type BarrierStatus = "operational" | "maintenance" | "offline"

export interface Barrier {
  id: number
  level_id: number
  name: string
  location_note: string | null
  status: BarrierStatus
  created_at: string
  updated_at: string
  // joined
  level_name?: string
}

export interface CreateBarrierPayload {
  level_id: number
  name: string
  location_note?: string
  status?: BarrierStatus
}

export type UpdateBarrierPayload = Partial<CreateBarrierPayload>

// ─── Incidents ────────────────────────────────────────────────────────────────

export type IncidentSeverity = "low" | "medium" | "high" | "critical"
export type IncidentStatus = "open" | "resolved" | "closed"

export interface Incident {
  id: number
  vehicle_id: number
  title: string
  description: string | null
  severity: IncidentSeverity
  status: IncidentStatus
  reported_at: string
  created_at: string
  updated_at: string
  // joined
  license_plate?: string
  customer_name?: string
}

export interface CreateIncidentPayload {
  vehicle_id: number
  title: string
  description?: string
  severity?: IncidentSeverity
  status?: IncidentStatus
}

export type UpdateIncidentPayload = Partial<CreateIncidentPayload>
