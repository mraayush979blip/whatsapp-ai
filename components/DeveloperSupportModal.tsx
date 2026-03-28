import { motion, AnimatePresence } from "framer-motion";
import { Coffee, X } from "lucide-react";

interface DeveloperSupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
}

const FEATURE_ROADMAP: Record<string, { status: string; eta: string; blurb: string }> = {
    "Status Feature": {
        status: "Planned",
        eta: "Target: mid-2026",
        blurb: "Photo and text status strip like WhatsApp — needs storage, feeds, and basic moderation.",
    },
    "Updates Feature": {
        status: "Planned",
        eta: "With Status",
        blurb: "Channels-style updates will likely ship together with the Status row.",
    },
    "Archive Feature": {
        status: "Design",
        eta: "TBD",
        blurb: "Archived chats with search — extra queries and UI pass on the list view.",
    },
    "Settings Feature": {
        status: "In progress",
        eta: "Upcoming",
        blurb: "Account, theme, and notification preferences consolidated in one place.",
    },
    "Dark & Light Mode": {
        status: "In progress",
        eta: "Soon",
        blurb: "Respect system theme and a manual toggle for web / PWA.",
    },
    "Video Calls": {
        status: "Planned",
        eta: "After voice",
        blurb: "WebRTC video once voice latency and TTS feel reliably human.",
    },
    "Disappearing Messages": {
        status: "Planned",
        eta: "TBD",
        blurb: "Per-chat timer and cleanup — needs a clear policy for the AI side too.",
    },
    "Communities Feature": {
        status: "On hold",
        eta: "Not scheduled",
        blurb: "Groups are paused until core 1:1 chat and calls are stable.",
    },
};

const DEFAULT_INFO = {
    status: "In progress",
    eta: "TBD",
    blurb: "This item is on the internal roadmap; thanks for your patience while it’s built carefully.",
};

export default function DeveloperSupportModal({ isOpen, onClose, featureName = "This feature" }: DeveloperSupportModalProps) {
    if (!isOpen) return null;

    const info = FEATURE_ROADMAP[featureName] ?? DEFAULT_INFO;

    const handleBuyCoffee = () => {
        const upiUrl = "upi://pay?pa=mraayush979@oksbi&pn=Aayush%20Sharma&cu=INR";
        window.location.href = upiUrl;
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 40 }}
                    transition={{ type: "spring", damping: 18, stiffness: 280, mass: 0.8 }}
                    className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative"
                >
                    <div className="bg-gradient-to-r from-[#008069] to-[#00a884] p-6 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                            <Coffee className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Work in progress</h2>
                        <p className="text-white/90 text-sm mt-1 font-medium">{featureName}</p>
                    </div>

                    <div className="p-6 text-center">
                        <div className="flex justify-center gap-2 mb-3 text-xs font-bold uppercase tracking-wide">
                            <span className="px-2 py-1 rounded-full bg-[#e7f8f3] text-[#008069]">{info.status}</span>
                            <span className="px-2 py-1 rounded-full bg-gray-100 text-[#54656f]">{info.eta}</span>
                        </div>
                        <p className="text-[#54656f] text-[15px] leading-relaxed mb-6 font-medium text-left">{info.blurb}</p>

                        <div className="flex flex-col space-y-3">
                            <button
                                onClick={handleBuyCoffee}
                                className="w-full bg-[#1ab08f] hover:bg-[#159a7c] text-white py-3 rounded-xl font-bold shadow-md shadow-[#1ab08f]/30 active:scale-[0.98] transition-all flex items-center justify-center"
                            >
                                <Coffee className="w-5 h-5 mr-2" />
                                Buy a coffee for faster shipping
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-[#54656f] py-3 rounded-xl font-bold active:scale-[0.98] transition-all"
                            >
                                Okay, I&apos;ll wait
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 bg-black/10 rounded-full text-white hover:bg-black/20 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
