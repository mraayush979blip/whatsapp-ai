"use client";

import { Phone, Video, Search, MoreVertical, ArrowLeft, Plus, MessageSquare, CircleDot, Users } from "lucide-react";
import { motion } from "framer-motion";

interface CallLog {
    id: string;
    name: string;
    avatar: string;
    time: string;
    type: "voice" | "video";
    status: "incoming" | "outgoing" | "missed";
}

const CALLS: CallLog[] = [
    { id: "1", name: "Jaan ❤️", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jaan", time: "Today, 10:15 AM", type: "voice", status: "outgoing" },
    { id: "2", name: "Mummy", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mummy", time: "Today, 9:20 AM", type: "video", status: "incoming" },
    { id: "3", name: "Papa", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=papa", time: "Yesterday, 8:45 PM", type: "voice", status: "missed" },
    { id: "4", name: "Bestie", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bestie", time: "February 28, 4:30 PM", type: "video", status: "outgoing" },
];

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

            {/* Call Logs */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 py-3">
                    <h2 className="text-[#008069] md:text-[#00a884] font-semibold text-sm mb-4">Recent</h2>
                    <div className="space-y-6">
                        {CALLS.map((call) => (
                            <div key={call.id} className="flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                                        <img src={call.avatar} alt={call.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className={`font-medium text-[17px] ${call.status === 'missed' ? 'text-red-500' : 'text-[#111b21] md:text-[#e9edef]'}`}>{call.name}</h3>
                                        <div className="flex items-center text-sm text-[#667781] md:text-[#8696a0] mt-0.5">
                                            {call.status === 'incoming' && <span className="mr-1 rotate-135">↙️</span>}
                                            {call.status === 'outgoing' && <span className="mr-1">↗️</span>}
                                            {call.status === 'missed' && <span className="mr-1 text-red-500 font-bold">↙️</span>}
                                            {call.time}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[#008069] md:text-[#00a884]">
                                    {call.type === 'voice' ? <Phone className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
