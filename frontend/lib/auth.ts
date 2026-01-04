import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export type UserType = "guest" | "regular"

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function auth() {
  const session = await getSession()
  const user = await getUser()
  
  if (!session || !user) {
    return null
  }
  
  return {
    user: {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      image: user.user_metadata?.avatar_url || null,
      type: (user.user_metadata?.user_type || 'regular') as UserType,
    },
    expires: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}
