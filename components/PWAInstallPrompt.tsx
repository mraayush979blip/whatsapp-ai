"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after a short delay
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-20 left-4 right-4 z-[100] bg-white rounded-xl shadow-2xl border border-gray-100 p-4 flex items-center justify-between"
                >
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#008069] rounded-lg flex items-center justify-center text-white font-bold">
                            GS
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">Install GapShap</h4>
                            <p className="text-[11px] text-gray-500">Add to home screen for better experience! 🚀</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleInstall}
                            className="bg-[#008069] text-white px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all flex items-center"
                        >
                            <Download size={14} className="mr-1" />
                            Install
                        </button>
                        <button
                            onClick={() => setShowPrompt(false)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
