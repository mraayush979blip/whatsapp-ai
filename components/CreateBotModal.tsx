"use client";

import { useState } from "react";
import { X, Camera, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CreateBotModalProps {
    onClose: () => void;
    onCreated: () => void;
    userId: string;
}

export default function CreateBotModal({ onClose, onCreated, userId }: CreateBotModalProps) {
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [specs, setSpecs] = useState("");
    const [avatar, setAvatar] = useState("😎"); // Default emoji
    const [mood, setMood] = useState(50); // 0 = Very Chill, 100 = Very Serious
    const [loading, setLoading] = useState(false);

    const emojis = ["😎", "🤖", "👻", "🦄", "🧸"];

    const handleCreate = async () => {
        if (!name || !role) return alert("Bhiya, naam aur role toh likho!");

        setLoading(true);
        try {
            // Check existing bots count
            const { count, error: countError } = await supabase
                .from("chatbots")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId);

            if (countError) throw countError;

            if (count !== null && count >= 4) {
                const upgrade = confirm("Bhiya, limit poori ho gayi! 😂 4 se zyada dost banane ke liye Premium chahiye. Developer Aayush ko mail karein?");
                if (upgrade) window.open("mailto:mraayush979@gmail.com?subject=Premium Upgrade Request: GapShap AI");
                setLoading(false);
                return;
            }

            const { error } = await supabase.from("chatbots").insert({
                user_id: userId,
                name,
                role,
                specifications: specs || "A supportive friend.",
                avatar_url: `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(avatar)}&size=128&bold=true`,
                mood_level: mood
            });

            if (error) throw error;
            onCreated();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Error creating chatbot. SQL run kiya tha na?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-[#075E54] text-white p-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">New Friend Details</h3>
                    <button onClick={onClose}><X className="w-6 h-6" /></button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5">
                    {/* Emoji Selection */}
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-4 border-[#25D366] text-4xl shadow-inner">
                            {avatar}
                        </div>
                        <div className="flex space-x-3 mt-4">
                            {emojis.map((e) => (
                                <button
                                    key={e}
                                    onClick={() => setAvatar(e)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${avatar === e ? "bg-[#25D366] scale-110 shadow-md" : "bg-gray-100 hover:bg-gray-200"}`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                        <p className="mt-2 text-[10px] text-gray-400 uppercase font-black tracking-widest">Select Vibe Emoji</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[12px] font-semibold text-[#075E54] uppercase tracking-wide">Name (Who is it?)</label>
                            <input
                                type="text"
                                placeholder="e.g. Pratu, Angry Boss"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border-b border-gray-300 py-2 outline-none focus:border-[#075E54] transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[12px] font-semibold text-[#075E54] uppercase tracking-wide">Role (Who is this to you?)</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full border-b border-gray-300 py-2 outline-none focus:border-[#075E54] bg-transparent transition-colors cursor-pointer"
                                required
                            >
                                <option value="" disabled>Select a role...</option>
                                <option value="Friend">Friend</option>
                                <option value="Girlfriend">Girlfriend</option>
                                <option value="Boyfriend">Boyfriend</option>
                                <option value="Teacher">Teacher</option>
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                                <option value="Brother">Brother</option>
                                <option value="Sister">Sister</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[12px] font-semibold text-[#075E54] uppercase tracking-wide flex justify-between">
                                Vibe / Mood
                                <span className="text-[#25D366]">{mood < 30 ? "Chill 🍹" : mood > 70 ? "Serious 🧐" : "Balanced 🕊️"}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={mood}
                                onChange={(e) => setMood(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#25D366] mt-3"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">
                                <span>Masti Mood</span>
                                <span>Serious Vibes</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-[12px] font-semibold text-[#075E54] uppercase tracking-wide">Specifications (Extra)</label>
                            <textarea
                                placeholder="e.g. Loves Indore Poha, very annoying but sweet."
                                value={specs}
                                onChange={(e) => setSpecs(e.target.value)}
                                className="w-full border-b border-gray-300 py-2 outline-none focus:border-[#075E54] transition-colors resize-none h-14"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full py-3 bg-[#25D366] text-white rounded-lg font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Add to Chats"}
                    </button>
                </div>
            </div>
        </div>
    );
}
