"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { MessageSquare, ChevronRight, Sparkles } from "lucide-react";

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error("Error logging in with Google:", error);
            alert("Registration failed! Check your Supabase Dashboard configuration.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full relative overflow-hidden bg-[#0a1a14]">
            {/* Dark Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#128C7E] opacity-10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#25D366] opacity-10 blur-[100px] rounded-full" />

            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, ease: "backOut" }}
                className="relative z-10 w-full max-w-[340px] px-4 text-center"
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

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="group relative flex items-center justify-center w-full space-x-4 py-4 px-8 bg-white rounded-[1.2rem] shadow-2xl hover:bg-[#25D366] hover:text-white transition-all duration-300 active:scale-95 disabled:opacity-50 overflow-hidden"
                >
                    {loading ? (
                        <div className="w-6 h-6 border-3 border-[#075E54] border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                                className="w-6 h-6"
                            />
                            <span className="font-bold text-gray-900 group-hover:text-white tracking-wide">Start GapShap</span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <div className="mt-16 relative">
                    <div className="flex justify-center space-x-3 mb-3">
                        <div className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce delay-75" />
                        <div className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce delay-150" />
                        <div className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce delay-300" />
                    </div>
                    <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-black">
                        Made for Bharat, by aayush.
                    </p>
                    <p className="text-[9px] text-white/20 italic mt-1 font-medium">
                        powered by pratu ai
                    </p>
                </div>
            </motion.div>

            {/* Background Text Decor */}
            <div className="absolute top-10 left-[-20px] text-white/5 font-black text-[120px] pointer-events-none select-none -rotate-12">GAPSHAP</div>
            <div className="absolute bottom-10 right-[-30px] text-white/5 font-black text-[100px] pointer-events-none select-none rotate-12">VIBES</div>
        </div>
    );
}
