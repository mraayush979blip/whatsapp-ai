"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Shield, Info, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

interface BotProfileModalProps {
    bot: {
        id: string;
        name: string;
        role: string;
        avatar_url: string;
        specifications: string;
        mood_level: number;
    };
    onClose: () => void;
    onDelete: () => void;
}

export default function BotProfileModal({ bot, onClose, onDelete }: BotProfileModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Bhiya, sach mein ${bot.name} ko delete karna hai? Saari baatein khatam ho jayengi! 😢`)) return;

        setIsDeleting(true);
        try {
            // First delete associated messages to prevent foreign key errors
            const { error: messagesError } = await supabase.from("messages").delete().eq("chatbot_id", bot.id);
            if (messagesError) throw messagesError;

            const { error } = await supabase.from("chatbots").delete().eq("id", bot.id);
            if (error) throw error;
            onDelete();
        } catch (err) {
            console.error("Delete error:", err);
            alert("Error deleting chatbot. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const moodLabel = bot.mood_level < 30 ? "Masti Mood (Chill) 🍹" : bot.mood_level > 70 ? "Serious Vibes 🧐" : "Balanced 🕊️";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full max-w-md bg-[#f0f2f5] rounded-t-[2rem] sm:rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header/Banner */}
                <div className="relative h-48 bg-[#075E54] flex items-center justify-center overflow-hidden">
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors z-10"
                    >
                        <X size={24} />
                    </button>

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-xl"
                    >
                        <img src={bot.avatar_url} alt={bot.name} className="w-full h-full object-cover" />
                    </motion.div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Basic Info */}
                    <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                        <h2 className="text-2xl font-bold text-[#111b21]">{bot.name}</h2>
                        <p className="text-[#667781] font-medium">{bot.role}</p>
                    </div>

                    {/* Vibe/Mood */}
                    <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
                        <div className="flex items-center text-[#075E54] font-bold text-xs uppercase tracking-wider mb-1">
                            <Shield size={14} className="mr-2" />
                            Current Personality
                        </div>
                        <p className="text-[#111b21] text-[15px] font-medium">{moodLabel}</p>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#25D366] transition-all duration-1000"
                                style={{ width: `${bot.mood_level}%` }}
                            />
                        </div>
                    </div>

                    {/* About */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center text-[#075E54] font-bold text-xs uppercase tracking-wider mb-2">
                            <Info size={14} className="mr-2" />
                            About & Description
                        </div>
                        <p className="text-[#3b4a54] text-[14px] leading-relaxed italic">
                            "{bot.specifications}"
                        </p>
                    </div>

                    {/* Account Settings */}
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full flex items-center justify-center space-x-2 py-4 px-4 bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 transition-colors font-bold disabled:opacity-50"
                        >
                            <Trash2 size={18} />
                            <span>{isDeleting ? "Deleting..." : "Delete Chatbot"}</span>
                        </button>
                    </div>

                    <div className="text-center pb-4">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                            Encrypted by GapShap AI
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
