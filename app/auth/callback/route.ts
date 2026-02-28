import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in search params, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        try {
            const supabase = await createClient()
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error) {
                const response = NextResponse.redirect(`${origin}${next}`)
                response.headers.set('Cache-Control', 'no-store, max-age=0')
                return response
            }
            console.error('Session exchange error:', error.message)
            return NextResponse.redirect(`${origin}/?error=session_exchange_failed`)
        } catch (err) {
            console.error('Callback error:', err)
            return NextResponse.redirect(`${origin}/?error=callback_internal_error`)
        }
    }

    return NextResponse.redirect(`${origin}/?error=no_code_provided`)
}
