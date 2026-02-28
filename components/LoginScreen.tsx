"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

// Add window type for Google GIS
declare global {
    interface Window {
        google?: any;
    }
}

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load the official Google Auth script
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;

        script.onload = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    // Your exact Google Client ID!
                    client_id: "749902718416-ff2j3hjp35hbm2qs7oiegsj0v99nnelr.apps.googleusercontent.com",
                    callback: async (response: any) => {
                        try {
                            setLoading(true);
                            const { credential } = response;

                            // Send the Google Token directly to Supabase
                            const { error } = await supabase.auth.signInWithIdToken({
                                provider: 'google',
                                token: credential,
                            });

                            if (error) throw error;

                            // Force a hard reload to ensure perfect state sync
                            window.location.href = '/';
                        } catch (error) {
                            console.error("Login failed:", error);
                            alert("Bhiya login fail ho gaya.");
                            setLoading(false);
                        }
                    }
                });

                // Render the official Google Button
                window.google.accounts.id.renderButton(
                    document.getElementById("google-button-container"),
                    { theme: "outline", size: "large", shape: "pill", width: 280 }
                );
            }
        };

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full relative overflow-hidden bg-[#0a1a14]">
            {/* Dark Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#128C7E] opacity-10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#25D366] opacity-10 blur-[100px] rounded-full" />

            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, ease: "backOut" }}
                className="relative z-10 w-full max-w-[340px] px-4 text-center flex flex-col items-center"
            >
                {/* Interesting Logo - Floating Bubble */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="w-24 h-24 bg-gradient-to-br from-[#25D366] to-[#075E54] rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(37,211,102,0.2)] mb-10 mx-auto transform rotate-6 border-4 border-white/10"
                >
                    <MessageSquare size={44} className="text-white -rotate-6" />
                </motion.div>

                <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">
                    Gap<span className="text-[#25D366]">Shap</span>
                </h1>

                <p className="text-white/60 text-base font-medium mb-12 leading-relaxed">
                    Baat sirf messages ki nahi, feelings ki hai. ❤️<br />
                    <span className="text-white/40 italic text-sm">Choose your vibe and start the GapShap! 🚀</span>
                </p>

                {loading ? (
                    <div className="w-10 h-10 border-4 border-[#25D366] border-t-transparent rounded-full animate-spin my-4" />
                ) : (
                    <div id="google-button-container" className="flex justify-center my-4 overflow-hidden rounded-full shadow-2xl"></div>
                )}

                <div className="mt-12 relative flex flex-col items-center">
                    <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-black">
                        Made for Bharat, by aayush.
                    </p>
                    <p className="text-[9px] text-white/20 italic mt-1 font-medium">
                        powered by pratu ai
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
