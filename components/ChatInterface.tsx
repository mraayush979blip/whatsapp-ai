"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Phone, Video, MoreVertical, ChevronLeft, Smile, Paperclip, Mic, Camera } from "lucide-react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import BotProfileModal from "./BotProfileModal";

interface Message {
    role: "user" | "bot";
    content: string;
    time: string;
    type?: "text" | "image" | "audio";
    media_url?: string;
}

interface ChatInterfaceProps {
    bot: {
        id: string;
        name: string;
        role: string;
        avatar_url: string;
        specifications: string;
        mood_level: number;
    };
    onBack: () => void;
    onBotDeleted: () => void;
}

const getGreetingTerm = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r === 'girlfriend' || r === 'boyfriend') return 'jaan';
    if (r === 'mother' || r === 'father') return 'beta';
    if (r === 'teacher') return 'student';
    return 'bhiya';
};

export default function ChatInterface({ bot, onBack, onBotDeleted }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleClearChat = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from("messages")
                .delete()
                .eq("chatbot_id", bot.id)
                .eq("user_id", user.id); // Explicit user_id to satisfy RLS

            if (error) throw error;

            // Log for debugging
            console.log("Chat cleared successfully for bot:", bot.name);

            // Reset to only welcome message
            setMessages([
                {
                    role: "bot",
                    content: `Oye! Main hoon ${bot.name}. Sab purani baatein bhool jao, naya start karte hain ${getGreetingTerm(bot.role)}! 😂`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }
            ]);

            setShowMenu(false);
            alert("Chat cleared! ✨");
        } catch (err) {
            console.error("Clear Error:", err);
            alert("Clear chat fail ho gaya bhiya. Check console.");
        }
    };

    const handleCallAlert = () => {
        alert("Developer is working on it! 🛠️\nYou can buy a coffee for the developer so he can do it fast. ☕💸");
    };

    // Initialize Audio
    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    }, []);

    // 1. Fetch Chat History from Supabase
    useEffect(() => {
        const fetchHistory = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("chatbot_id", bot.id)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error fetching history:", error);
            } else if (data && data.length > 0) {
                setMessages(data.map(m => ({
                    role: m.role,
                    content: m.content,
                    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                })));
            } else {
                // No history, show welcome
                setMessages([
                    {
                        role: "bot",
                        content: `Oye! Main hoon ${bot.name}. Kya haal chaal ${getGreetingTerm(bot.role)}? 😂`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    }
                ]);
            }
        };

        fetchHistory();
    }, [bot.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const userMsg: Message = {
            role: "user",
            content: input,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        const currentInput = input;
        setInput("");

        try {
            audioRef.current?.play().catch(() => { });
        } catch (e) { }

        // 2. Save User Message to Supabase
        await supabase.from("messages").insert({
            chatbot_id: bot.id,
            user_id: user.id,
            role: "user",
            content: currentInput
        });

        // 2.5 DB Auto-Pruning (Keep database small for free tier)
        const pruneOldMessages = async () => {
            // A. Row-limit (keep last 150)
            const { count } = await supabase
                .from("messages")
                .select("*", { count: 'exact', head: true })
                .eq("chatbot_id", bot.id);

            if (count && count > 150) {
                const { data: oldest } = await supabase
                    .from("messages")
                    .select("id")
                    .eq("chatbot_id", bot.id)
                    .order("created_at", { ascending: true })
                    .limit(count - 150);

                if (oldest) {
                    const idsToDelete = oldest.map(m => m.id);
                    await supabase.from("messages").delete().in("id", idsToDelete);
                }
            }

            // B. Time-limit (delete older than 7 days)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            await supabase
                .from("messages")
                .delete()
                .eq("chatbot_id", bot.id)
                .lt("created_at", sevenDaysAgo);
        };
        pruneOldMessages();

        setTimeout(() => {
            setIsTyping(true);
        }, 600);

        try {
            // 3. Send full history to API for context
            const chatHistoryForAPI = messages.concat(userMsg).map(m => ({
                role: m.role === "bot" ? "assistant" : "user",
                content: m.content
            }));

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userInput: currentInput,
                    botName: bot.name,
                    botRole: bot.role,
                    botSpecifications: bot.specifications,
                    mood_level: bot.mood_level,
                    history: chatHistoryForAPI // Passing history here
                }),
            });

            const data = await response.json();

            setTimeout(async () => {
                const botMsg: Message = {
                    role: "bot",
                    content: data.content,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                setMessages((prev) => [...prev, botMsg]);
                setIsTyping(false);

                // 4. Save Bot Response to Supabase
                await supabase.from("messages").insert({
                    chatbot_id: bot.id,
                    user_id: user.id,
                    role: "bot",
                    content: data.content
                });

            }, 1200);

        } catch (error) {
            console.error("Error calling chat API:", error);
            setIsTyping(false);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Dev check: Bucket check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        alert("Media Sharing: Developer is setting up the 'gapshap_media' bucket. You can buy a coffee to help him finish this faster! ☕💸");
        // Logic for uploading will go here once user confirms bucket creation
    };

    return (
        <div className="flex flex-col h-full relative bg-[#E5DDD5] overflow-hidden" onClick={() => showMenu && setShowMenu(false)}>
            {/* Header Area */}
            <div className="bg-[#008069] md:bg-[#f0f2f5] text-white md:text-[#111b21] px-3 py-2 flex items-center shadow-md md:shadow-sm md:border-b md:border-[#d1d7db] z-30 min-h-[56px] md:min-h-[59px]">
                <button onClick={onBack} className="flex items-center active:bg-[#ffffff22] rounded-full p-1 -ml-1 transition-colors md:hidden">
                    <ChevronLeft className="w-7 h-7 -mr-0.5" />
                </button>

                <button
                    onClick={() => setShowProfile(true)}
                    className="flex-1 flex items-center overflow-hidden hover:bg-[#ffffff11] md:hover:bg-gray-200 p-1 rounded-lg md:rounded-none transition-colors cursor-pointer"
                >
                    <div className="w-[38px] h-[38px] rounded-full bg-gray-300 mr-2.5 flex-shrink-0 relative overflow-hidden border-[0.5px] border-white/20 md:border-none">
                        <img src={bot.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 overflow-hidden text-left">
                        <h2 className="text-[15.5px] font-bold md:font-semibold md:text-[16px] truncate leading-tight tracking-tight">{bot.name}</h2>
                        <p className="text-[11.5px] md:text-[13px] leading-tight text-[#f1f1f1cc] md:text-[#667781] mt-0.5 font-medium md:font-normal">
                            {isTyping ? "typing..." : "online"}
                        </p>
                    </div>
                </button>

                <div className="flex space-x-4 items-center pl-2 relative pr-1">
                    <button onClick={handleCallAlert} className="active:scale-95 transition-transform"><Video className="w-[20px] h-[20px] fill-white md:fill-[#54656f] text-transparent md:text-[#54656f]" /></button>
                    <button onClick={handleCallAlert} className="active:scale-95 transition-transform ml-1"><Phone className="w-[18px] h-[18px] fill-white md:fill-[#54656f] text-transparent md:text-[#54656f]" /></button>

                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="hover:bg-[#ffffff22] md:hover:bg-gray-200 p-1.5 rounded-full transition-colors active:scale-90"
                            title="Menu"
                        >
                            <MoreVertical className="w-[22px] h-[22px] text-white md:text-[#54656f]" />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-xl z-50 text-gray-800 py-1 origin-top-right border border-gray-100 overflow-hidden"
                                >
                                    <button
                                        onClick={handleClearChat}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors"
                                    >
                                        Clear chat
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            alert("Disappearing messages: Dev is working on it! ☕💸");
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors border-t border-gray-50"
                                    >
                                        Disappearing messages
                                    </button>
                                    <button
                                        onClick={() => supabase.auth.signOut()}
                                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50"
                                    >
                                        Logout
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-2 py-4 relative chat-canvas flex flex-col space-y-1"
                style={{
                    backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                    backgroundSize: '300px',
                    backgroundRepeat: 'repeat'
                }}
            >
                <div className="flex justify-center mb-4">
                    <span className="bg-[#D1EBFA] text-[#555] px-2 py-1 rounded-md text-[11px] font-medium uppercase shadow-sm">Today</span>
                </div>

                <div className="flex justify-center">
                    <span className="bg-[#fff9c2] text-[#555] px-3 py-1.5 rounded-lg text-[11px] text-center shadow-sm max-w-[90%] mb-4">
                        🔒 Messages are end-to-end friendship and Hinglish encrypted. No one outside of this chat, not even WhatsApp, can read them.
                    </span>
                </div>

                {messages.map((m, i) => (
                    <MessageBubble key={i} message={m} />
                ))}

                {isTyping && <TypingIndicator botName={bot.name} />}
            </div>

            {/* Input Area */}
            <div className="px-2 py-3 md:px-4 md:py-2.5 bg-[#E5DDD5] md:bg-[#f0f2f5] flex items-center space-x-1.5 md:space-x-3 z-10 md:mb-1">
                <Smile className="w-7 h-7 text-gray-500 hidden md:block cursor-pointer active:scale-90 mx-1" />
                <button onClick={() => fileInputRef.current?.click()} className="hidden md:block active:scale-90 mx-1">
                    <Paperclip className="w-6 h-6 text-gray-500" />
                </button>
                <div className="flex-1 bg-white rounded-[24px] md:rounded-lg px-3 py-2 shadow-sm flex items-center md:py-2.5">
                    <Smile className="w-6 h-6 text-gray-400 mr-2 md:hidden" />
                    <input
                        type="text"
                        className="flex-1 outline-none text-[15px] bg-transparent md:text-[15px] text-[#111b21] placeholder-[#54656f]"
                        placeholder="Type a message"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="md:hidden">
                        <Paperclip className="w-5 h-5 text-gray-500 rotate-[-45deg] mx-1" />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()}>
                        <Camera className="w-5 h-5 text-gray-500 mx-1 md:hidden" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*"
                    />
                </div>
                <button
                    onPointerDown={(e) => {
                        e.preventDefault(); // Keeps keyboard open on mobile
                        if (input.trim()) {
                            handleSendMessage();
                        } else {
                            alert("Voice Note: Dev is working on it! ☕💸");
                        }
                    }}
                    className="w-12 h-12 md:w-10 md:h-10 md:bg-transparent bg-[#00a884] rounded-full flex items-center justify-center shadow-md md:shadow-none active:scale-95 transition-transform shrink-0 touch-none select-none"
                >
                    {input.trim() ? (
                        <Send className="w-6 h-6 md:w-7 md:h-7 text-white md:text-[#54656f] ml-0.5 md:ml-0" />
                    ) : (
                        <Mic className="w-6 h-6 md:w-7 md:h-7 text-white md:text-[#54656f]" />
                    )}
                </button>
            </div>

            {/* Background Decorator */}
            <div className="absolute inset-0 chat-bg opacity-[0.05] pointer-events-none" />
            {/* Profile Modal */}
            <AnimatePresence>
                {showProfile && (
                    <BotProfileModal
                        bot={bot}
                        onClose={() => setShowProfile(false)}
                        onDelete={onBotDeleted}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
