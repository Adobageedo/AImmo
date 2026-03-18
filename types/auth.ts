import type { User as SupabaseUser } from '@supabase/supabase-js';

export type User = SupabaseUser;

export interface AuthSession {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  full_name?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}
