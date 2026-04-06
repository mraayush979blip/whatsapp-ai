"use client";

import { useState } from "react";
import { X, Mail, Send, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface AddPersonModalProps {
    onClose: () => void;
    onAdded: () => void;
}

export default function AddPersonModal({ onClose, onAdded }: AddPersonModalProps) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [foundUser, setFoundUser] = useState<any>(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!email || !email.includes("@")) return alert("Bhiya, valid email toh dalo!");
        setLoading(true);
        setSearched(false);
        try {
            // Search in profiles table (assuming it exists with email and full_name/name)
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("email", email.toLowerCase())
                .single();

            if (data) {
                setFoundUser(data);
            } else {
                setFoundUser(null);
            }
            setSearched(true);
        } catch (err) {
            console.error("Search error:", err);
            setFoundUser(null);
            setSearched(true);
        } finally {
            setLoading(false);
        }
    };

    const handleAddImmediately = async () => {
        if (!foundUser) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            // Add to chatbots table as a 'Real Person'
            // In a real app, this would be a 'contacts' table, 
            // but we'll follow the existing pattern for now.
            const { error } = await supabase.from("chatbots").insert({
                user_id: user.id,
                name: foundUser.name || foundUser.full_name || "Real Person",
                role: "Real Person",
                specifications: `Real user: ${foundUser.email}`,
                avatar_url: foundUser.avatar_url || `https://ui-avatars.com/api/?background=008069&color=fff&name=${encodeURIComponent(foundUser.name || "RP")}`,
                mood_level: 50
            });

            if (error) throw error;
            alert("Dost add ho gaya! Ab GapShap shuru karo. 😂");
            onAdded();
        } catch (err) {
            console.error(err);
            alert("Add karne mein dikat aa gayi bhiya.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvite = () => {
        const subject = encodeURIComponent("Join me on GapShap! 🚀");
        const body = encodeURIComponent(`Oye! GapShap join kar le bhiya. Mast system hai AI aur real logon se baat karne ka. \n\nCheck it out here: ${window.location.origin}`);
        window.open(`mailto:${email}?subject=${subject}&body=${body}`);
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 40 }}
                    className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-[#008069] text-white p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <UserPlus className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Add Real Person</h3>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#008069] uppercase tracking-wider">Search by Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="friend@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-b-2 border-gray-100 focus:border-[#008069] outline-none transition-all text-[15px]"
                                />
                            </div>
                        </div>

                        {!searched ? (
                            <button
                                onClick={handleSearch}
                                disabled={loading || !email}
                                className="w-full py-3.5 bg-[#008069] text-white rounded-xl font-bold shadow-lg shadow-green-900/10 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Search Friend</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {foundUser ? (
                                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-full bg-[#008069] flex items-center justify-center text-white font-bold text-lg">
                                            {foundUser.name?.[0] || foundUser.full_name?.[0] || "U"}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-[#111b21]">{foundUser.name || foundUser.full_name}</p>
                                            <p className="text-xs text-gray-500">{foundUser.email}</p>
                                        </div>
                                        <button 
                                            onClick={handleAddImmediately}
                                            disabled={loading}
                                            className="p-2 bg-[#008069] text-white rounded-full shadow-md active:scale-90 transition-transform"
                                        >
                                            <UserPlus className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4 py-2">
                                        <p className="text-sm text-gray-500 italic">"Bhiya, ye banda GapShap pe nahi hai. Invite bhejein?"</p>
                                        <button
                                            onClick={handleSendInvite}
                                            className="w-full py-3.5 bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/10 active:scale-95 transition-all flex items-center justify-center space-x-2"
                                        >
                                            <Mail className="w-4 h-4" />
                                            <span>Send Email Invite</span>
                                        </button>
                                        <button 
                                            onClick={() => setSearched(false)}
                                            className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                                        >
                                            Try another email
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
