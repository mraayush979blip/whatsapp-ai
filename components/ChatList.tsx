"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MessageSquare, MoreVertical, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import CreateBotModal from "./CreateBotModal";
import { motion, AnimatePresence } from "framer-motion";

interface ChatBot {
    id: string;
    name: string;
    role: string;
    avatar_url: string;
    specifications: string;
    mood_level: number;
}

export default function ChatList({ onSelectChat, userId, selectedChatId }: { onSelectChat: (bot: ChatBot) => void; userId: string; selectedChatId?: string }) {
    const [bots, setBots] = useState<ChatBot[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBots = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error: sbError } = await supabase
                .from("chatbots")
                .select("*")
                .order("created_at", { ascending: false });

            if (sbError) {
                // If the error code is '42P01', it means the table doesn't exist
                if (sbError.code === '42P01') {
                    throw new Error("Chatbots table nahi mila. Please run the SQL script in Supabase Dashboard first!");
                }
                throw sbError;
            }
            setBots(data || []);
        } catch (err: any) {
            console.error("Fetch error:", err);
            setError(err.message || "Something went wrong while fetching bots.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBots();
    }, []);

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* WhatsApp Header: Mobile App Style vs Desktop Web Style */}
            <div className="bg-[#008069] md:bg-[#f0f2f5] text-white md:text-[#54656f] p-4 md:p-3 pb-0 md:pb-3 z-10 shadow-md md:shadow-none md:border-b md:border-[#d1d7db] flex-shrink-0">
                <div className="flex items-center justify-between mb-4 md:mb-0">
                    <h1 className="text-xl font-bold tracking-tight md:hidden">WhatsApp</h1>

                    {/* Desktop Avatar Placeholder */}
                    <div className="hidden md:flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-300">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} alt="Profile" className="w-full h-full rounded-full" />
                        </div>
                    </div>

                    <div className="flex items-center space-x-5 md:space-x-4 pr-1">
                        <button className="hidden md:block hover:bg-gray-200 p-1.5 rounded-full" title="Communities">
                            <MessageSquare className="w-5 h-5 text-[#54656f]" />
                        </button>
                        <Search className="w-5 h-5 md:hidden opacity-90" />
                        <button onClick={() => supabase.auth.signOut()} title="Logout" className="md:hover:bg-gray-200 md:p-1.5 rounded-full">
                            <LogOut className="w-5 h-5 opacity-90 md:opacity-100 md:text-[#54656f]" />
                        </button>
                        <button className="md:hover:bg-gray-200 md:p-1.5 rounded-full">
                            <MoreVertical className="w-5 h-5 opacity-90 md:opacity-100 md:text-[#54656f]" />
                        </button>
                    </div>
                </div>

                {/* WhatsApp Tabs Mockup (Hidden on Desktop) */}
                <div className="flex md:hidden text-center uppercase text-[13.5px] font-bold tracking-wider opacity-90 cursor-pointer">
                    <div className="w-[10%] pb-2.5 flex justify-center border-b-[3px] border-white/40"><MessageSquare className="w-5 h-5" /></div>
                    <div className="w-[30%] pb-2.5 border-b-[3px] border-white">CHATS</div>
                    <div
                        className="w-[30%] pb-2.5 hover:bg-[#ffffff11] transition-colors"
                        onClick={() => {
                            const wantFeature = confirm("Status Feature: Developer Aayush is setting up the storytelling system. 📖✨ Want to request this feature faster? Click OK to email him! 😂🙌");
                            if (wantFeature) window.open("mailto:mraayush979@gmail.com?subject=Feature Request: GapShap Status");
                        }}
                    >
                        STATUS
                    </div>
                    <div
                        className="w-[30%] pb-2.5 hover:bg-[#ffffff11] transition-colors"
                        onClick={() => {
                            const wantFeature = confirm("Calls Feature: AI Voice calls are in the works! 🎙️🤖 Want to request this feature faster? Click OK to email him! 😂🙌");
                            if (wantFeature) window.open("mailto:mraayush979@gmail.com?subject=Feature Request: GapShap AI Calls");
                        }}
                    >
                        CALLS
                    </div>
                </div>
            </div>

            {/* Desktop Search Bar Mockup */}
            <div className="hidden md:flex p-2 border-b border-[#d1d7db] bg-white">
                <div className="flex items-center bg-[#f0f2f5] rounded-lg px-3 py-1.5 w-full">
                    <Search className="w-4 h-4 text-[#54656f] mr-3" />
                    <input type="text" placeholder="Search or start new chat" className="bg-transparent outline-none text-sm w-full text-[#111b21] placeholder-[#54656f]" />
                </div>
            </div>

            {/* Bots List */}
            <div className="flex-1 overflow-y-auto bg-white">
                {error ? (
                    <div className="p-10 text-center">
                        <div className="text-red-500 font-bold mb-2">Error! ❌</div>
                        <p className="text-sm text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={fetchBots}
                            className="bg-[#008069] text-white px-4 py-2 rounded-lg text-sm font-semibold active:scale-95 transition-transform"
                        >
                            Try Again
                        </button>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-[#008069] border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {bots.length === 0 && (
                            <div className="p-10 text-center text-gray-400">
                                <p className="text-[17px] font-medium text-gray-600">No chats yet 😂</p>
                                <p className="text-sm mt-2 leading-relaxed">Niche (+) wale green button pe click karke dost banao bhiya!</p>
                            </div>
                        )}
                        {bots.map((bot) => (
                            <motion.div
                                key={bot.id}
                                whileTap={{ backgroundColor: "#f0f2f5" }}
                                onClick={() => onSelectChat(bot)}
                                className={`flex items-center px-4 py-3.5 cursor-pointer relative transition-colors ${selectedChatId === bot.id ? 'bg-[#f0f2f5]' : 'hover:bg-gray-50/80 bg-white'}`}
                            >
                                <div className="w-[52px] h-[52px] rounded-full bg-gray-200 mr-4 flex-shrink-0 relative border-[0.5px] border-gray-100 shadow-sm">
                                    <img src={bot.avatar_url} alt={bot.name} className="w-full h-full object-cover rounded-full" />
                                </div>
                                <div className="flex-1 overflow-hidden border-b border-gray-50 pb-0.5">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h3 className="font-bold text-[16.5px] text-[#111b21] truncate">{bot.name}</h3>
                                        <span className="text-[11.5px] text-[#667781] font-medium">12:34 PM</span>
                                    </div>
                                    <div className="flex justify-between items-center pr-1">
                                        <p className="text-[14px] text-[#667781] truncate pr-2">
                                            {bot.role}: Click to start GapShap...
                                        </p>
                                        <div className="w-5 h-5 bg-[#25D366] rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                                            1
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowModal(true)}
                className="absolute bottom-6 right-6 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-xl z-20"
            >
                <Plus className="w-7 h-7" />
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <CreateBotModal
                        userId={userId}
                        onClose={() => setShowModal(false)}
                        onCreated={fetchBots}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
