import { motion, AnimatePresence } from "framer-motion";
import { Coffee, X } from "lucide-react";

interface DeveloperSupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
}

export default function DeveloperSupportModal({ isOpen, onClose, featureName = "This feature" }: DeveloperSupportModalProps) {
    if (!isOpen) return null;

    const handleBuyCoffee = () => {
        // Direct UPI payment trigger for Indian users
        const upiUrl = 'upi://pay?pa=mraayush979@oksbi&pn=Aayush%20Sharma&cu=INR';
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
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#008069] to-[#00a884] p-6 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                            <Coffee className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Developer is working on it! 🛠️</h2>
                    </div>

                    {/* Content */}
                    <div className="p-6 text-center">
                        <p className="text-[#54656f] text-[15px] leading-relaxed mb-6 font-medium">
                            {featureName} is currently under development. You can buy a coffee for the developer so he can build it faster! ☕💸
                        </p>

                        <div className="flex flex-col space-y-3">
                            <button
                                onClick={handleBuyCoffee}
                                className="w-full bg-[#1ab08f] hover:bg-[#159a7c] text-white py-3 rounded-xl font-bold shadow-md shadow-[#1ab08f]/30 active:scale-[0.98] transition-all flex items-center justify-center"
                            >
                                <Coffee className="w-5 h-5 mr-2" />
                                Buy a Coffee
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-[#54656f] py-3 rounded-xl font-bold active:scale-[0.98] transition-all"
                            >
                                Okay, I'll wait
                            </button>
                        </div>
                    </div>

                    {/* Close Button */}
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
