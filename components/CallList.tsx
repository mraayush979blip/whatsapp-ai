"use client";

import { Phone, Video, Search, MoreVertical, ArrowLeft, Plus, MessageSquare, CircleDot, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function CallList({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: any) => void }) {
    return (
        <div className="flex flex-col h-full bg-white md:bg-[#111b21] relative">
            {/* Header */}
            <div className="bg-[#008069] md:bg-[#111b21] text-white md:text-[#e9edef] p-4 flex items-center justify-between shadow-md md:shadow-none">
                <h1 className="text-xl font-bold tracking-tight md:text-2xl md:font-bold">Calls</h1>
                <div className="flex items-center space-x-5 md:space-x-4">
                    <Search className="w-5 h-5 opacity-90 md:text-[#aebac1]" />
                    <MoreVertical className="w-5 h-5 opacity-90 md:text-[#aebac1]" />
                </div>
            </div>

            {/* Desktop Search Bar Mockup */}
            <div className="hidden md:flex p-2 md:px-3 border-b-0 bg-[#111b21] pb-3">
                <div className="flex items-center bg-[#202c33] rounded-lg px-3 py-1.5 w-full">
                    <Search className="w-4 h-4 text-[#aebac1] mr-3" />
                    <input type="text" placeholder="Search calls" className="bg-transparent outline-none text-sm w-full text-[#e9edef] placeholder-[#8696a0]" />
                </div>
            </div>

            {/* Call Logs - Empty State */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white md:bg-[#111b21]">
                <div className="w-16 h-16 bg-gray-100 md:bg-[#202c33] rounded-full flex items-center justify-center mb-4">
                    <Phone className="w-8 h-8 text-gray-400 md:text-[#8696a0]" />
                </div>
                <h3 className="text-lg font-medium text-[#111b21] md:text-[#e9edef] mb-2">No recent calls</h3>
                <p className="text-sm text-[#667781] md:text-[#8696a0] max-w-[250px]">
                    To start a call, select a contact and tap the phone icon in the chat.
                </p>
            </div>

            {/* WhatsApp Bottom Navigation Mockup (Mobile Only) */}
            <div className="flex md:hidden w-full bg-white border-t border-gray-100 justify-around items-center pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-30 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] relative">
                <div className={`flex flex-col items-center flex-1 cursor-pointer ${activeTab === 'chats' ? 'text-[#008069]' : 'text-[#54656f]'}`} onClick={() => onTabChange('chats')}>
                    <div className={`${activeTab === 'chats' ? 'bg-[#D1EBFA]' : ''} px-4 py-1 rounded-full mb-1`}>
                        <MessageSquare className={`w-6 h-6 ${activeTab === 'chats' ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide">Chats</span>
                </div>
                <div className="flex flex-col items-center flex-1 cursor-pointer text-[#54656f]">
                    <div className="px-4 py-1 mb-1">
                        <CircleDot className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide">Updates</span>
                </div>
                <div className="flex flex-col items-center flex-1 cursor-pointer text-[#54656f]">
                    <div className="px-4 py-1 mb-1">
                        <Users className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide">Communities</span>
                </div>
                <div className={`flex flex-col items-center flex-1 cursor-pointer ${activeTab === 'calls' ? 'text-[#008069]' : 'text-[#54656f]'}`} onClick={() => onTabChange('calls')}>
                    <div className={`${activeTab === 'calls' ? 'bg-[#D1EBFA]' : ''} px-4 py-1 rounded-full mb-1`}>
                        <Phone className={`w-6 h-6 ${activeTab === 'calls' ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide">Calls</span>
                </div>
            </div>

            {/* Floating Action Button (Mobile) */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-[80px] md:bottom-6 right-4 md:right-6 w-[56px] h-[56px] bg-[#25D366] rounded-[16px] md:rounded-full flex items-center justify-center text-white shadow-xl z-20"
            >
                <Plus className="w-7 h-7" />
            </motion.button>
        </div>
    );
}
