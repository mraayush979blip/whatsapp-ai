import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Palette } from "lucide-react";

interface ThemeOption {
    id: string;
    name: string;
    previewColor: string;
    bgStyle: any;
}

export const THEMES: ThemeOption[] = [
    {
        id: "default",
        name: "Classic Doodle",
        previewColor: "#E5DDD5",
        bgStyle: {
            backgroundColor: "#E5DDD5",
            backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
            backgroundSize: '300px',
            backgroundRepeat: 'repeat'
        }
    },
    {
        id: "dark",
        name: "Dark Matrix",
        previewColor: "#0b141a",
        bgStyle: {
            backgroundColor: "#0b141a",
            backgroundImage: "none",
        }
    },
    {
        id: "light",
        name: "Clean White",
        previewColor: "#f0f2f5",
        bgStyle: {
            backgroundColor: "#f0f2f5",
            backgroundImage: "none",
        }
    },
];

interface ChatThemeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentThemeId: string;
    onSelectTheme: (themeId: string) => void;
}

export default function ChatThemeModal({ isOpen, onClose, currentThemeId, onSelectTheme }: ChatThemeModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl relative"
                >
                    {/* Header */}
                    <div className="bg-[#008069] p-5 text-center relative">
                        <Palette className="w-8 h-8 text-white mx-auto mb-2 opacity-90" />
                        <h2 className="text-xl font-bold text-white tracking-tight">Chat Theme</h2>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1 rounded-full text-white/80 hover:bg-white/10 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col space-y-3 bg-[#f0f2f5]">
                        {THEMES.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => {
                                    onSelectTheme(theme.id);
                                    onClose();
                                }}
                                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${currentThemeId === theme.id ? 'border-[#008069] bg-white shadow-sm' : 'border-transparent bg-white hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-10 h-10 rounded-full border shadow-inner overflow-hidden"
                                        style={theme.id === 'default' ? theme.bgStyle : { backgroundColor: theme.previewColor }}
                                    />
                                    <span className={`font-semibold ${currentThemeId === theme.id ? 'text-[#008069]' : 'text-[#111b21]'}`}>
                                        {theme.name}
                                    </span>
                                </div>
                                {currentThemeId === theme.id && (
                                    <div className="w-6 h-6 rounded-full bg-[#008069] flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
