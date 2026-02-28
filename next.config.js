import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    register: true,
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swMinify: true,
    disable: process.env.NODE_ENV === "development",
    workboxOptions: {
        disableDevLogs: true,
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    turbopack: {}, // Silence the Turbopack webpack warning
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'ui-avatars.com' },
            { protocol: 'https', hostname: 'i.pinimg.com' },
            { protocol: 'https', hostname: 'user-images.githubusercontent.com' },
            { protocol: 'https', hostname: 'assets.mixkit.co' },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/supabase-auth/:path*',
                destination: 'https://gxelbvvgkpmgfudukxrf.supabase.co/auth/v1/:path*',
            },
        ]
    },
}

export default withPWA(nextConfig)
