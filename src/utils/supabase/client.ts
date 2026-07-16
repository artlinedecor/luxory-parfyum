import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    "/api/supabase-proxy",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
