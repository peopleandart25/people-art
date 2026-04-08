import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>

let browserClient: BrowserClient | null = null

export function createClient() {
  if (browserClient) return browserClient
  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return browserClient
}
