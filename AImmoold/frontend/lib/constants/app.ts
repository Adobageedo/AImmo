// Application-wide constants

export const APP_NAME = "AImmo"
export const APP_DESCRIPTION = "La plateforme de gestion immobilière intelligente"
export const APP_CONTACT_EMAIL = "contact@aimmo.fr"

// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

// Date formats for the French locale
export const DATE_FORMAT = {
    short: "dd/MM/yyyy",
    long: "d MMMM yyyy",
    full: "EEEE d MMMM yyyy",
    withTime: "dd/MM/yyyy HH:mm",
}

// Pagination defaults
export const PAGINATION = {
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
}

// Debounce delays (in ms)
export const DEBOUNCE = {
    search: 300,
    autosave: 1000,
    resize: 150,
}

// Toast durations (in ms)
export const TOAST_DURATION = {
    short: 3000,
    default: 5000,
    long: 8000,
}

// Local storage keys
export const STORAGE_KEYS = {
    auth: "auth-storage",
    theme: "theme-preference",
    recentDocuments: "recent-documents",
    dashboardLayout: "dashboard-layout",
}
