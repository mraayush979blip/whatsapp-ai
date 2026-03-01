import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
    // 🔥 ZERO-BLOCK TUNNEL: Masking EVERYTHING 
    // Phone & Laptop both use the proxy, making carrier blocking impossible
    const isBrowser = typeof window !== 'undefined';
    const finalUrl = isBrowser
        ? `${window.location.origin}/safe-api`
        : process.env.NEXT_PUBLIC_SUPABASE_URL!;

    return createBrowserClient(
        finalUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        // ✅ No custom cookieOptions — let Supabase use its default cookie name
        // so the browser client and server-side middleware read the SAME cookie
    )
}

export const supabase = createClient()
