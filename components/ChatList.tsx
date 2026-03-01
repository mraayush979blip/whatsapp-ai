"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MessageSquare, MoreVertical, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import CreateBotModal from "./CreateBotModal";
import { motion, AnimatePresence } from "framer-motion";
import DeveloperSupportModal from "./DeveloperSupportModal";
import UserProfileModal from "./UserProfileModal";

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
    const [showMenu, setShowMenu] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [devFeature, setDevFeature] = useState<{ isOpen: boolean, name: string }>({ isOpen: false, name: "" });
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
        <div className="flex flex-col h-full bg-white md:bg-[#111b21] relative" onClick={() => showMenu && setShowMenu(false)}>
            {/* WhatsApp Header: Mobile App Style vs Desktop Web Style */}
            <div className="bg-[#008069] md:bg-[#111b21] text-white md:text-[#e9edef] p-4 md:p-4 pb-0 md:pb-3 z-10 shadow-md md:shadow-none flex-shrink-0">
                <div className="flex items-center justify-between mb-4 md:mb-0">
                    <h1 className="text-xl font-bold tracking-tight md:text-2xl md:font-bold">WhatsApp</h1>

                    {/* Desktop Avatar Placeholder (Now hidden since it's on left panel) */}

                    <div className="flex items-center space-x-5 md:space-x-3 pr-1">
                        <button className="hidden md:flex hover:bg-[#202c33] p-1.5 rounded-full items-center justify-center text-[#aebac1]" title="Communities">
                            <Plus className="w-5 h-5" />
                        </button>
                        <Search className="w-5 h-5 md:hidden opacity-90" />
                        <button onClick={() => supabase.auth.signOut()} title="Logout" className="md:hidden hover:bg-gray-200 md:p-1.5 rounded-full">
                            <LogOut className="w-5 h-5 opacity-90" />
                        </button>
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                className="md:hover:bg-[#202c33] md:p-1.5 rounded-full transition-colors active:scale-90"
                            >
                                <MoreVertical className="w-5 h-5 opacity-90 md:opacity-100 md:text-[#aebac1]" />
                            </button>
                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-xl z-50 text-gray-800 py-1 origin-top-right border border-gray-100 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => window.open('https://aayush-sharma-beige.vercel.app/', '_blank')}
                                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors"
                                        >
                                            About Developer
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                setShowProfileModal(true);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors border-t border-gray-50"
                                        >
                                            Your Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                setDevFeature({ isOpen: true, name: "Dark & Light Mode" });
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors border-t border-gray-50"
                                        >
                                            Dark / Light Theme
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                window.dispatchEvent(new Event('show-install-prompt'));
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors border-t border-gray-50"
                                        >
                                            Install App
                                        </button>
                                        <button
                                            onClick={() => supabase.auth.signOut()}
                                            className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50 md:hidden"
                                        >
                                            Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* WhatsApp Tabs Mockup (Hidden on Desktop) */}
                <div className="flex md:hidden text-center uppercase text-[13.5px] font-bold tracking-wider opacity-90 cursor-pointer">
                    <div className="w-[10%] pb-2.5 flex justify-center border-b-[3px] border-white/40"><MessageSquare className="w-5 h-5" /></div>
                    <div className="w-[30%] pb-2.5 border-b-[3px] border-white">CHATS</div>
                    <div
                        className="w-[30%] pb-2.5 hover:bg-[#ffffff11] transition-colors"
                        onClick={() => setDevFeature({ isOpen: true, name: "Status Feature" })}
                    >
                        STATUS
                    </div>
                    <div
                        className="w-[30%] pb-2.5 hover:bg-[#ffffff11] transition-colors"
                        onClick={() => setDevFeature({ isOpen: true, name: "Calls Feature" })}
                    >
                        CALLS
                    </div>
                </div>
            </div>

            {/* Desktop Search Bar Mockup */}
            <div className="hidden md:flex p-2 md:px-3 border-b-0 bg-[#111b21] pb-3">
                <div className="flex items-center bg-[#202c33] md:bg-[#202c33] rounded-lg px-3 py-1.5 w-full">
                    <Search className="w-4 h-4 text-[#aebac1] mr-3" />
                    <input type="text" placeholder="Search or start a new chat" className="bg-transparent outline-none text-sm w-full text-[#e9edef] placeholder-[#8696a0]" />
                </div>
            </div>

            {/* Desktop Filter Tabs */}
            <div className="hidden md:flex px-3 pb-3 bg-[#111b21] space-x-2 overflow-x-auto no-scrollbar border-b border-[#202c33]">
                <button className="bg-[#202c33] text-[#00a884] px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">All</button>
                <button className="bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942] px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">Unread</button>
                <button className="bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942] px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">Favourites</button>
                <button className="bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942] px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">Groups</button>
            </div>

            {/* Bots List */}
            <div className="flex-1 overflow-y-auto bg-white md:bg-[#111b21]">
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
                            <div className="p-10 text-center text-gray-400 md:text-[#8696a0]">
                                <p className="text-[17px] font-medium text-gray-600 md:text-[#e9edef]">No chats yet 😂</p>
                                <p className="text-sm mt-2 leading-relaxed">Niche (+) wale green button pe click karke dost banao bhiya!</p>
                            </div>
                        )}
                        {bots.map((bot) => (
                            <motion.div
                                key={bot.id}
                                whileTap={{ backgroundColor: "#f0f2f5" }}
                                onClick={() => onSelectChat(bot)}
                                className={`flex items-center pl-4 pr-3 py-3 cursor-pointer relative transition-colors ${selectedChatId === bot.id ? 'bg-[#f0f2f5] md:bg-[#2a3942]' : 'hover:bg-gray-50/80 md:hover:bg-[#202c33] bg-white md:bg-transparent'}`}
                            >
                                <div className="w-[49px] h-[49px] rounded-full bg-gray-200 mr-3.5 flex-shrink-0 relative border-none shadow-sm md:shadow-none">
                                    <img src={bot.avatar_url} alt={bot.name} className="w-full h-full object-cover rounded-full" />
                                </div>
                                <div className={`flex-1 overflow-hidden border-b pb-3 pt-1 ${selectedChatId === bot.id ? 'border-transparent' : 'border-gray-50 md:border-[#202c33]'}`}>
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h3 className="font-normal text-[17px] text-[#111b21] md:text-[#e9edef] truncate tracking-tight">{bot.name}</h3>
                                        <span className="text-[12px] text-[#667781] md:text-[#8696a0] font-normal">12:34 PM</span>
                                    </div>
                                    <div className="flex justify-between items-center pr-1">
                                        <p className="text-[14px] text-[#667781] md:text-[#8696a0] truncate pr-2">
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
            <DeveloperSupportModal
                isOpen={devFeature.isOpen}
                onClose={() => setDevFeature(prev => ({ ...prev, isOpen: false }))}
                featureName={devFeature.name}
            />
            <UserProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
            />
        </div>
    );
}
