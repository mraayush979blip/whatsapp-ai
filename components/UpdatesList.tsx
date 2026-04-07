"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Camera, Search, MoreVertical, CircleDot } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function UpdatesList() {
    const [statuses, setStatuses] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            
        setStatuses(data || []);
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
        <div className="flex flex-col h-full bg-white md:bg-[#111b21] overflow-y-auto no-scrollbar">
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
                        {statuses.map((status) => (
                            <motion.div 
                                key={status.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => window.open(status.image_url, '_blank')}
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
        </div>
    );
}
