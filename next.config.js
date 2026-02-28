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
        skipWaiting: true, // 👈 FORCES the new version to take over immediately
        clientsClaim: true, // 👈 FORCES all open tabs to update right away
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
                source: '/safe-api/:path*',
                destination: 'https://gxelbvvgkpmgfudukxrf.supabase.co/:path*',
            },
        ]
    },
}

export default withPWA(nextConfig)
