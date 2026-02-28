/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'whatsapp-green': '#25D366',
                'whatsapp-teal': '#075E54',
                'whatsapp-light': '#DCF8C6',
                'whatsapp-bg': '#E5DDD5',
            }
        },
    },
    plugins: [],
}
