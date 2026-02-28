import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
    // If we're in the browser, we use our own domain as a proxy prefix
    // This stops mobile carriers from seeing the blocked .supabase.co domain
    const isBrowser = typeof window !== 'undefined';
    const finalUrl = isBrowser
        ? `${window.location.origin}/supabase-api`
        : process.env.NEXT_PUBLIC_SUPABASE_URL!;

    return createBrowserClient(
        finalUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export const supabase = createClient()
