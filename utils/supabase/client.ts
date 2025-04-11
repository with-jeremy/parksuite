import { createBrowserClient } from '@supabase/ssr';
import { sbp_dd2719a3f1bf59e22ec7879893891ee903fbf5f9 } from '@supabase/mcp-server-supabase';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}