import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { origin } = new URL(request.url);
    const supabase = await createClient();

    // We initiate the OAuth flow from the server
    // This bypasses mobile browser client-side cookie blocking
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            // 🔥 MUST match the rewrite in next.config.js
            redirectTo: `${origin}/auth/callback`,
            skipBrowserRedirect: true,
        },
    });

    if (error) {
        console.error("Auth init error:", error.message);
        return NextResponse.redirect(`${origin}/?error=auth_init_failed`);
    }

    if (!data.url) {
        return NextResponse.redirect(`${origin}/?error=no_auth_url`);
    }

    // 🔥 GLOBAL MOBILE DATA FIX: Replace ALL instances of Supabase Host with our own Proxied Path
    // We use a regex with /g to ensure 'redirect_uri' and other params are also proxied!
    const supabaseHost = 'gxelbvvgkpmgfudukxrf.supabase.co';
    const proxiedUrl = data.url.replace(new RegExp(supabaseHost, 'g'), `${new URL(origin).host}/supabase`);

    // Redirect the user to the fully Proxied Google URL
    return NextResponse.redirect(proxiedUrl);
}
