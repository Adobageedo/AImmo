// Authentication Types

export interface User {
    id: string
    email: string
    fullName?: string
    avatarUrl?: string
}

export interface Organization {
    id: string
    name: string
    description?: string
    role: UserRole
}

export type UserRole = "admin" | "manager" | "user"

export interface AuthSession {
    user: User
    accessToken: string
    refreshToken: string
    expiresAt: number
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface SignupCredentials {
    email: string
    password: string
    organizationName?: string
}

export interface AuthResponse {
    success: boolean
    user?: User
    organizations?: Organization[]
    error?: string
}

export interface PasswordResetRequest {
    email: string
}

export interface PasswordUpdateRequest {
    password: string
}
