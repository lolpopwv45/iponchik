import { createBrowserClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

export { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase/env'

let serverClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  const url = getSupabaseUrl()
  const anonKey = getSupabaseAnonKey()
  if (!url || !anonKey) return null

  if (typeof window === 'undefined') {
    if (!serverClient) serverClient = createClient(url, anonKey)
    return serverClient
  }

  return createBrowserClient(url, anonKey)
}
