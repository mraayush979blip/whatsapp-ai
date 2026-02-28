import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
    // 🔥 THE ONLY FIX FOR CARRIER BLOCKS:
    // We proxy EVERY request through /safe-api on our own domain
    const isBrowser = typeof window !== 'undefined';
    const finalUrl = isBrowser
        ? `${window.location.origin}/safe-api`
        : process.env.NEXT_PUBLIC_SUPABASE_URL!;

    return createBrowserClient(
        finalUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export const supabase = createClient()
