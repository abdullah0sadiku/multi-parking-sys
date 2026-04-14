// Centralised endpoint map — change base paths in one place

export const ENDPOINTS = {
  // Dashboard stats
  STATS: "/stats",

  // Auth
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    ME: "/auth/me",
    BOOTSTRAP: "/auth/bootstrap",
  },

  // Unified Parking Management
  PARKING: {
    LIST:            "/parking",
    DETAIL:          (levelId: number) => `/parking/${levelId}`,
    SPOTS:           (levelId: number) => `/parking/${levelId}/spots`,
    GENERATE_SPOTS:  (levelId: number) => `/parking/${levelId}/generate-spots`,
    UPDATE_SPOT:     (spotId: number)  => `/parking/spots/${spotId}`,
    RECOMMEND_SPOT:  "/parking/recommend-spot",
  },

  // Legacy individual routes (kept for backward compatibility)
  PARKING_LEVELS: {
    LIST: "/parking-levels",
    DETAIL: (id: number) => `/parking-levels/${id}`,
  },

  // Parking Spots
  PARKING_SPOTS: {
    LIST: "/parking-spots",
    DETAIL: (id: number) => `/parking-spots/${id}`,
  },

  // Customers
  CUSTOMERS: {
    LIST: "/customers",
    DETAIL: (id: number) => `/customers/${id}`,
  },

  // Vehicles
  VEHICLES: {
    LIST: "/vehicles",
    DETAIL: (id: number) => `/vehicles/${id}`,
  },

  // Sessions
  SESSIONS: {
    LIST: "/sessions",
    DETAIL: (id: number) => `/sessions/${id}`,
    END: (id: number) => `/sessions/${id}/end`,
    PAY: (id: number) => `/sessions/${id}/pay`,
  },

  // Tariffs
  TARIFFS: {
    LIST: "/tariffs",
    DETAIL: (id: number) => `/tariffs/${id}`,
  },

  // Subscriptions
  SUBSCRIPTIONS: {
    LIST: "/subscriptions",
    DETAIL: (id: number) => `/subscriptions/${id}`,
    GENERATE_INVOICE: (id: number) => `/subscriptions/${id}/generate-invoice`,
  },

  // Invoices
  INVOICES: {
    LIST: "/invoices",
    DETAIL: (id: number) => `/invoices/${id}`,
    DOWNLOAD: (id: number) => `/invoices/${id}/download`,
  },

  // Payments
  PAYMENTS: {
    LIST: "/payments",
    DETAIL: (id: number) => `/payments/${id}`,
  },

  // Barriers
  BARRIERS: {
    LIST: "/barriers",
    DETAIL: (id: number) => `/barriers/${id}`,
  },

  // Incidents
  INCIDENTS: {
    LIST: "/incidents",
    DETAIL: (id: number) => `/incidents/${id}`,
  },

  // System users (admin/staff accounts)
  USERS: {
    LIST: "/users",
    DETAIL: (id: number) => `/users/${id}`,
  },

  // Customer self-service portal
  PORTAL: {
    REGISTER:           "/portal/register",
    PROFILE:            "/portal/profile",
    VEHICLES:           "/portal/vehicles",
    VEHICLE:            (id: number) => `/portal/vehicles/${id}`,
    SPOTS_AVAILABLE:    "/portal/spots/available",
    TARIFFS:            "/portal/tariffs",
    SUBSCRIPTIONS:      "/portal/subscriptions",
    SUBSCRIPTION_CANCEL:(id: number) => `/portal/subscriptions/${id}/cancel`,
    SESSIONS:           "/portal/sessions",
    INVOICES:           "/portal/invoices",
    INVOICE_DOWNLOAD:   (id: number) => `/portal/invoices/${id}/download`,
    INVOICE_PAY:        (id: number) => `/portal/invoices/${id}/pay`,
  },
} as const
