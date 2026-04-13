"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Camera, Search, MoreVertical, CircleDot, ChevronLeft, MessageSquare, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function UpdatesList({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: any) => void }) {
    const [statuses, setStatuses] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Status Viewer States
    const [activeStatusIndex, setActiveStatusIndex] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);

    // Auto Advance Status Logic
    useEffect(() => {
        if (activeStatusIndex === null) {
            setProgress(0);
            return;
        }

        const duration = 5000; // 5 seconds per status
        const intervalTime = 50;
        const step = (intervalTime / duration) * 100;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(() => {
                        if (activeStatusIndex < statuses.length - 1) {
                            setActiveStatusIndex(activeStatusIndex + 1);
                            setProgress(0);
                        } else {
                            setActiveStatusIndex(null);
                        }
                    }, 0);
                    return 100;
                }
                return prev + step;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, [activeStatusIndex, statuses.length]);

    const handleNextStatus = () => {
        if (activeStatusIndex !== null && activeStatusIndex < statuses.length - 1) {
            setActiveStatusIndex(activeStatusIndex + 1);
            setProgress(0);
        } else {
            setActiveStatusIndex(null);
        }
    };

    const handlePrevStatus = () => {
        if (activeStatusIndex !== null && activeStatusIndex > 0) {
            setActiveStatusIndex(activeStatusIndex - 1);
            setProgress(0);
        }
    };

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // Fetch last 24h statuses
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { data } = await supabase
            .from("statuses")
            .select("*, profiles(name, avatar_url)")
            .gte("created_at", yesterday.toISOString())
            .order("created_at", { ascending: false });
            
        let combinedStatuses = data || [];

        // Render AI Statuses
        if (user) {
            const { data: bots } = await supabase
                .from("chatbots")
                .select("*")
                .eq("user_id", user.id)
                .neq("role", "Real Person");

            if (bots && bots.length > 0) {
                const todayStr = new Date().toLocaleDateString("en-CA");
                const storageKey = `gapshap_ai_statuses_${todayStr}_${user.id}`;
                let aiStatuses = [];
                
                try {
                    const stored = localStorage.getItem(storageKey);
                    if (stored) aiStatuses = JSON.parse(stored);
                } catch(e) {}

                if (aiStatuses.length === 0) {
                    const CAPTIONS = ["Feeling cute, might delete later 😂", "Kya din hai yar aaj ka! ✨", "Single forever! but happy 😎", "Mausam mast hai! 🌧️", "Zindagi chal rahi hai bas...", "Coffee and vibes. ☕", "Hustling everyday! 🚀"];
                    const numToPick = Math.min(3, bots.length);
                    const shuffledBots = [...bots].sort(() => 0.5 - Math.random());
                    const pickedBots = shuffledBots.slice(0, numToPick);
                    
                    aiStatuses = pickedBots.map((bot, i) => ({
                        id: `ai_${bot.id}_${todayStr}`,
                        user_id: bot.id, 
                        image_url: `https://picsum.photos/seed/${bot.id}_${todayStr}/400/600`,
                        caption: CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)],
                        created_at: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
                        profiles: {
                            name: `${bot.name} (AI)`,
                            avatar_url: bot.avatar_url
                        }
                    }));
                    localStorage.setItem(storageKey, JSON.stringify(aiStatuses));
                }
                
                combinedStatuses = [...aiStatuses, ...combinedStatuses].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }
        }

        setStatuses(combinedStatuses);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUploadStatus = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert("File size too large (max 10MB)!");
            return;
        }

        try {
            setIsUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('status_images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('status_images')
                .getPublicUrl(filePath);

            const caption = prompt("Write a caption for your status:") || "";

            const { error: insertError } = await supabase.from("statuses").insert({
                user_id: user.id,
                image_url: publicUrl,
                caption
            });

            if (insertError) throw insertError;

            fetchData();
        } catch (err) {
            console.error(err);
            alert("Failed to upload status.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col h-full bg-white md:bg-[#111b21]">
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                {/* Header */}
            <div className="bg-[#008069] md:bg-[#111b21] text-white md:text-[#e9edef] p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm md:shadow-none">
                <h1 className="text-xl font-bold md:text-2xl">Updates</h1>
                <div className="flex items-center space-x-4 md:space-x-2">
                    <button className="p-1.5 rounded-full hover:bg-white/10 md:hover:bg-[#202c33] transition-colors">
                        <Camera className="w-5 h-5" />
                    </button>
                    <button className="p-1.5 rounded-full hover:bg-white/10 md:hover:bg-[#202c33] transition-colors">
                        <Search className="w-5 h-5" />
                    </button>
                    <button className="p-1.5 rounded-full hover:bg-white/10 md:hover:bg-[#202c33] transition-colors">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Status Section */}
                <section>
                    <h2 className="text-[#008069] md:text-[#e9edef] font-bold text-lg mb-4">Status</h2>
                    <div className="flex items-center space-x-4 mb-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 p-0.5 border-2 border-dashed border-gray-400">
                                {user && (
                                    <img 
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                                        alt="My Status" 
                                        className={`w-full h-full object-cover rounded-full ${isUploading ? 'opacity-50 animate-pulse' : ''}`}
                                    />
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 bg-[#00a884] text-white rounded-full p-0.5 border-2 border-white md:border-[#111b21]">
                                <Plus className="w-3 h-3" />
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-[#111b21] md:text-[#e9edef]">My status</p>
                            <p className="text-sm text-gray-500 md:text-[#8696a0]">{isUploading ? "Uploading..." : "Tap to add status update"}</p>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleUploadStatus}
                        />
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs font-semibold text-gray-500 md:text-[#8696a0] uppercase tracking-wider">Recent updates</p>
                        {statuses.map((status, index) => (
                            <motion.div 
                                key={status.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { setActiveStatusIndex(index); setProgress(0); }}
                                className="flex items-center space-x-4 cursor-pointer hover:bg-gray-50 md:hover:bg-[#202c33] -mx-4 px-4 py-2 transition-colors"
                            >
                                <div className="w-14 h-14 rounded-full p-0.5 border-2 border-[#00a884] overflow-hidden">
                                    <img src={status.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${status.user_id}`} alt={status.profiles?.name || 'User'} className="w-full h-full object-cover rounded-full" />
                                </div>
                                <div className="flex-1 border-b border-gray-100 md:border-[#202c33] pb-2">
                                    <p className="font-bold text-[#111b21] md:text-[#e9edef]">{status.profiles?.name || 'Unknown User'}</p>
                                    <p className="text-sm text-gray-500 md:text-[#8696a0]">
                                        {new Date(status.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {status.caption ? ` • ${status.caption}` : ''}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Channels Section */}
                <section className="pt-4 border-t border-gray-100 md:border-[#202c33]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[#111b21] md:text-[#e9edef] font-bold text-lg">Channels</h2>
                        <Plus className="w-5 h-5 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-500 md:text-[#8696a0] mb-4">Stay updated on topics that matter to you. Find channels to follow below.</p>
                    
                    <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2">
                        {["WhatsApp", "Indore News", "GapShap AI", "Aayush Sharma"].map((channel, i) => (
                            <div key={i} className="flex-shrink-0 w-32 h-40 border border-gray-200 md:border-[#202c33] rounded-xl p-3 flex flex-col items-center text-center space-y-2 bg-[#f0f2f5] md:bg-transparent">
                                <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${channel}`} alt={channel} />
                                </div>
                                <p className="text-sm font-bold truncate w-full text-[#111b21] md:text-[#e9edef]">{channel}</p>
                                <button className="mt-auto w-full py-1 bg-[#00a8841a] text-[#00a884] rounded-full text-xs font-bold hover:bg-[#00a8842a] transition-colors">
                                    Follow
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <button className="mt-6 w-full py-2.5 bg-[#00a884] text-white rounded-full font-bold active:scale-95 transition-transform">
                        Find channels
                    </button>
                </section>
            </div>

                {/* Immersive Status Viewer Modal */}
                {activeStatusIndex !== null && statuses[activeStatusIndex] && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col select-none"
                    >
                        {/* Progress Bars */}
                        <div className="absolute top-3 left-2 right-2 flex space-x-1 z-20">
                            {statuses.map((_, i) => (
                                <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden shrink-0">
                                    {i === activeStatusIndex && (
                                        <div className="h-full bg-white" style={{ width: `${progress}%` }} />
                                    )}
                                    {i < activeStatusIndex && (
                                        <div className="h-full bg-white w-full" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Header */}
                        <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-4 z-20">
                            <div className="flex items-center space-x-3">
                                <button onClick={() => setActiveStatusIndex(null)} className="text-white hover:bg-white/10 p-1 rounded-full transition">
                                    <ChevronLeft className="w-7 h-7" />
                                </button>
                                <img 
                                    src={statuses[activeStatusIndex].profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${statuses[activeStatusIndex].user_id}`} 
                                    className="w-10 h-10 rounded-full object-cover border border-white/20" 
                                    alt="avatar" 
                                />
                                <div>
                                    <p className="text-white font-bold text-[15px]">{statuses[activeStatusIndex].profiles?.name || 'Unknown User'}</p>
                                    <p className="text-white/70 text-[12px]">Today, {new Date(statuses[activeStatusIndex].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                            <button className="text-white hover:bg-white/10 p-1.5 rounded-full transition">
                                <MoreVertical className="w-5 h-5"/>
                            </button>
                        </div>

                        {/* Image Viewer Area - Clicks handle navigation */}
                        <div className="flex-1 flex items-center justify-center relative bg-[#111] overflow-hidden" 
                            onClick={(e) => {
                                const width = e.currentTarget.clientWidth;
                                if (e.clientX < width * 0.3) handlePrevStatus();
                                else handleNextStatus();
                            }}
                        >
                            <img 
                                src={statuses[activeStatusIndex].image_url} 
                                alt="Status" 
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>

                        {/* Caption Overlay */}
                        {statuses[activeStatusIndex].caption && (
                            <div className="absolute bottom-12 left-0 right-0 text-center px-6 z-20 pointer-events-none">
                                <div className="bg-black/60 backdrop-blur-sm text-white px-5 py-2.5 rounded-2xl inline-block max-w-[90%] break-words">
                                    <p className="text-sm shadow-sm">{statuses[activeStatusIndex].caption}</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
            {/* WhatsApp Bottom Navigation Mockup (Mobile Only) */}
            <div className="flex md:hidden w-full bg-white border-t border-gray-100 justify-around items-center pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-30 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <div className={`flex flex-col items-center flex-1 cursor-pointer ${activeTab === 'chats' ? 'text-[#008069]' : 'text-[#54656f]'}`} onClick={() => onTabChange('chats')}>
                    <div className={`${activeTab === 'chats' ? 'bg-[#D1EBFA]' : ''} px-4 py-1 rounded-full mb-1`}>
                        <MessageSquare className={`w-6 h-6 ${activeTab === 'chats' ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide">Chats</span>
                </div>
                <div className={`flex flex-col items-center flex-1 cursor-pointer ${activeTab === 'status' ? 'text-[#008069]' : 'text-[#54656f]'}`} onClick={() => onTabChange('status')}>
                    <div className={`${activeTab === 'status' ? 'bg-[#D1EBFA]' : ''} px-4 py-1 rounded-full mb-1`}>
                        <CircleDot className={`w-6 h-6 ${activeTab === 'status' ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide">Updates</span>
                </div>
                <div className={`flex flex-col items-center flex-1 cursor-pointer ${activeTab === 'calls' ? 'text-[#008069]' : 'text-[#54656f]'}`} onClick={() => onTabChange('calls')}>
                    <div className={`${activeTab === 'calls' ? 'bg-[#D1EBFA]' : ''} px-4 py-1 rounded-full mb-1`}>
                        <Phone className={`w-6 h-6 ${activeTab === 'calls' ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide">Calls</span>
                </div>
            </div>
        </div>
    );
}
