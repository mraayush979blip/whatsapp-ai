"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Phone, Video, MoreVertical, ChevronLeft, Smile, Paperclip, Mic, Camera, Plus } from "lucide-react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import BotProfileModal from "./BotProfileModal";
import DeveloperSupportModal from "./DeveloperSupportModal";
import ChatThemeModal, { THEMES } from "./ChatThemeModal";
import VoiceCallScreen from "./VoiceCallScreen";
import { v4 as uuidv4 } from 'uuid';

interface Message {
    id?: string;
    role: "user" | "bot";
    content: string;
    time: string;
    type?: "text" | "image" | "audio";
    media_url?: string;
    status?: "sent" | "delivered" | "read";
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
    const [isCalling, setIsCalling] = useState(false);
    const [themeConfig, setThemeConfig] = useState<{ isOpen: boolean, themeId: string }>({
        isOpen: false,
        themeId: typeof window !== "undefined" ? localStorage.getItem("chat_theme") || "default" : "default"
    });
    const [devFeature, setDevFeature] = useState<{ isOpen: boolean, name: string }>({ isOpen: false, name: "" });
    const [isUploading, setIsUploading] = useState(false);
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

    const handleCallAlert = (featureName: string) => {
        setDevFeature({ isOpen: true, name: featureName });
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

        // Implement hard limit of 50 messages to force users to clear chat
        if (messages.length >= 50) {
            alert("Bhiya storage full ho gaya hai! 😅 Please click on the 3-dots menu and select 'Clear chat' to proceed further.");
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const userMsgId = Date.now().toString();
        const userMsg: Message = {
            id: userMsgId,
            role: "user",
            content: input,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: "sent"
        };

        setMessages((prev) => [...prev, userMsg]);
        const currentInput = input;
        setInput("");

        try {
            audioRef.current?.play().catch(() => { });
        } catch (e) { }

        // Start local read receipt tick simulation
        // 1. Double tap (delivered)
        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === userMsgId ? { ...m, status: "delivered" } : m));
        }, 1500);

        // 2. Blue tick (read)
        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === userMsgId ? { ...m, status: "read" } : m));
        }, 4500);

        // 2. Save User Message to Supabase
        await supabase.from("messages").insert({
            chatbot_id: bot.id,
            user_id: user.id,
            role: "user",
            content: currentInput
        });

        // 2.5 DB Auto-Pruning (Keep database small for free tier)
        const pruneOldMessages = async () => {
            // Optimization: Only run this heavy operation 5% of the time 
            // OR if the client explicitly sees it's growing too large
            if (Math.random() > 0.05 && messages.length < 145) return;

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
        // Fire and forget, don't await so UI doesn't lag
        pruneOldMessages().catch(console.error);

        // NOTE: we removed the static 600ms setTimeout for isTyping. Typing is now delayed until blue tick.

        try {
            // 3. Send full history to API for context
            const chatHistoryForAPI = messages.concat(userMsg).map(m => ({
                role: m.role === "bot" ? "assistant" : "user",
                content: m.content
            }));

            let userProfile = { name: "User", gender: "Unknown", bio: "No specific details." };
            try {
                const storedProfile = localStorage.getItem("gapshap_user_profile");
                if (storedProfile) {
                    const parsed = JSON.parse(storedProfile);
                    if (parsed.name) userProfile.name = parsed.name;
                    if (parsed.gender) userProfile.gender = parsed.gender;
                    if (parsed.bio) userProfile.bio = parsed.bio;
                }
            } catch (e) { }

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userInput: currentInput,
                    botName: bot.name,
                    botRole: bot.role,
                    botSpecifications: bot.specifications,
                    mood_level: bot.mood_level,
                    history: chatHistoryForAPI,
                    userProfile
                }),
            });

            const data = await response.json();

            // Calculate timing offsets
            // Wait for the read blue tick (4.5s max total elapsed) before typing
            const elapsedTime = Date.now() - parseInt(userMsgId);
            const remainingToStartTyping = Math.max(0, 4500 - elapsedTime);

            setTimeout(() => {
                setIsTyping(true);

                // Simulate human typing speed (roughly ~35ms per character, min 2s, max 7s)
                const textLength = data.content?.length || 0;
                const typingDuration = Math.min(Math.max(textLength * 35, 2000), 7000);

                setTimeout(async () => {
                    const botMsg: Message = {
                        id: Date.now().toString(),
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

                }, typingDuration);

            }, remainingToStartTyping);

        } catch (error) {
            console.error("Error calling chat API:", error);
            setIsTyping(false);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { data, error: uploadError } = await supabase.storage
                .from('gapshap_media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('gapshap_media')
                .getPublicUrl(filePath);

            // 3. Immediately send as a message to the bot

            const userMsgId = Date.now().toString();
            const userMsg: Message = {
                id: userMsgId,
                role: "user",
                content: "Sent a photo 📸 (Check the image above)",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: "sent",
                type: "image",
                media_url: publicUrl
            };

            setMessages((prev) => [...prev, userMsg]);

            audioRef.current?.play().catch(() => { });

            // Save to DB
            await supabase.from("messages").insert({
                chatbot_id: bot.id,
                user_id: user.id,
                role: "user",
                content: "Sent a photo 📸",
                type: "image",
                media_url: publicUrl
            });

            // 4. Trigger AI Response about the photo
            setIsTyping(true);

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userInput: "I just sent you a photo! What do you think?",
                    botName: bot.name,
                    botRole: bot.role,
                    botSpecifications: bot.specifications,
                    mood_level: bot.mood_level,
                    history: messages.map(m => ({ role: m.role === "bot" ? "assistant" : "user", content: m.content })),
                    userProfile: { name: "User", gender: "Unknown", bio: "No specific details." }
                }),
            });

            const aiData = await response.json();

            const botMsg: Message = {
                id: Date.now().toString(),
                role: "bot",
                content: aiData.content || "Arre wah! Sahi pic hai.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);

            await supabase.from("messages").insert({
                chatbot_id: bot.id,
                user_id: user.id,
                role: "bot",
                content: botMsg.content
            });

        } catch (error) {
            console.error(error);
            alert("Bhiya photo upload mein problem aa gayi. Sayad storage limit full hai (50MB).");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#efeae2] md:bg-[#0b141a] relative">
            {/* Header */}
            <div className="bg-[#008069] md:bg-[#202c33] text-white md:text-[#e9edef] p-3 flex items-center justify-between shadow-sm z-10 shrink-0 border-b-0 md:border-b md:border-[#2f3b43]">
                <div className="flex items-center">
                    <button onClick={onBack} className="md:hidden mr-2 active:scale-95 transition-transform">
                        <ChevronLeft className="w-7 h-7" />
                    </button>

                    <button
                        onClick={() => setShowProfile(true)}
                        className="flex-1 flex items-center overflow-hidden hover:bg-[#ffffff11] md:hover:bg-[#2a3942] p-1 rounded-lg md:rounded-none transition-colors cursor-pointer"
                    >
                        <div className="w-[38px] h-[38px] rounded-full bg-gray-300 mr-2.5 flex-shrink-0 relative overflow-hidden border-[0.5px] border-white/20 md:border-none">
                            <img src={bot.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 overflow-hidden text-left">
                            <h2 className="text-[15.5px] font-bold md:font-semibold md:text-[16px] truncate leading-tight tracking-tight">{bot.name}</h2>
                            <p className="text-[11.5px] md:text-[13px] leading-tight text-[#f1f1f1cc] md:text-[#8696a0] mt-0.5 font-medium md:font-normal">
                                {isTyping ? "typing..." : "online"}
                            </p>
                        </div>
                    </button>
                </div>

                <div className="flex space-x-4 items-center pl-2 relative pr-1">
                    <button onClick={() => handleCallAlert("Video Calls")} className="active:scale-95 transition-transform"><Video className="w-[20px] h-[20px] fill-white md:fill-transparent text-[#e9edef] md:text-[#aebac1]" /></button>
                    <button onClick={() => setIsCalling(true)} className="active:scale-95 transition-transform ml-1"><Phone className="w-[18px] h-[18px] fill-white md:fill-transparent text-[#e9edef] md:text-[#aebac1]" /></button>

                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="active:scale-90 transition-transform md:hover:bg-[#374248] md:p-1.5 rounded-full -mr-1.5"
                        >
                            <MoreVertical className="w-5 h-5 text-white md:text-[#aebac1]" />
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
                                            setThemeConfig(prev => ({ ...prev, isOpen: true }));
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors border-t border-gray-50"
                                    >
                                        Wallpaper / Theme
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            setDevFeature({ isOpen: true, name: "Disappearing Messages" });
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors border-t border-gray-50"
                                    >
                                        Disappearing messages
                                    </button>
                                    <button
                                        onClick={() => window.open('https://aayush-sharma-beige.vercel.app/', '_blank')}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors border-t border-gray-50"
                                    >
                                        About Developer
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
                className={`flex-1 overflow-y-auto px-2 py-4 relative chat-canvas flex flex-col space-y-1 ${themeConfig.themeId === "dark" ? "bg-[#0b141a]" : ""}`}
                style={THEMES.find(t => t.id === themeConfig.themeId)?.bgStyle || THEMES[0].bgStyle}
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
            <div className="bg-[#f0f0f0] md:bg-[#202c33] p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] flex items-end space-x-1 md:space-x-2 w-full z-10 shrink-0 min-h-[60px] md:min-h-[62px] mt-auto">
                <button
                    onClick={() => setDevFeature({ isOpen: true, name: "Media Sharing" })}
                    className="p-2 md:p-3 md:pb-3 pb-2.5 text-[#54656f] md:text-[#aebac1] active:scale-95 transition-transform shrink-0"
                >
                    <Plus className="w-6 h-6 md:w-7 md:h-7 mb-0.5 md:mb-0" />
                </button>

                <div className="flex-1 bg-white md:bg-[#2a3942] rounded-3xl md:rounded-lg flex items-end min-h-[42px] max-h-[120px] overflow-hidden shadow-sm md:shadow-none border-[0.5px] border-gray-200 md:border-none mb-1 md:my-auto transition-all">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Message"
                        className="flex-1 bg-transparent px-4 py-[11px] md:py-[10px] outline-none resize-none no-scrollbar text-[16px] placeholder-[#8696a0] text-[#111b21] md:text-[#e9edef] leading-snug w-full"
                        rows={1}
                    />

                    <div className="flex items-center space-x-3.5 text-[#54656f] md:text-[#aebac1] pr-4 pb-[11px] md:hidden shrink-0">
                        <button onClick={() => fileInputRef.current?.click()}>
                            <Paperclip className="w-5 h-5 -rotate-45" />
                        </button>
                        <button onClick={() => fileInputRef.current?.click()}>
                            {isUploading ? (
                                <div className="w-[22px] h-[22px] border-2 border-[#aebac1] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Camera className="w-[22px] h-[22px]" />
                            )}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/*"
                            disabled={isUploading}
                        />
                    </div>
                </div>

                <div className="flex shrink-0 items-center justify-center mb-1 md:my-auto ml-1 mr-1">
                    <button
                        onPointerDown={(e) => {
                            e.preventDefault(); // Keeps keyboard open on mobile
                            if (input.trim()) {
                                handleSendMessage();
                            } else {
                                setDevFeature({ isOpen: true, name: "Voice Notes" });
                            }
                        }}
                        className="w-[48px] h-[48px] md:w-10 md:h-10 md:bg-transparent bg-[#00a884] rounded-full flex items-center justify-center shadow-sm md:shadow-none active:scale-95 transition-transform touch-none select-none z-20"
                    >
                        {input.trim() ? (
                            <Send className="w-[20px] h-[20px] md:w-6 md:h-6 text-white md:text-[#aebac1] ml-1 md:ml-0" />
                        ) : (
                            <Mic className="w-[22px] h-[22px] md:w-6 md:h-6 text-white md:text-[#aebac1]" />
                        )}
                    </button>
                </div>
            </div>

            <div className="absolute inset-0 chat-bg opacity-[0.05] md:opacity-[0.02] pointer-events-none" />

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
            <DeveloperSupportModal
                isOpen={devFeature.isOpen}
                onClose={() => setDevFeature(prev => ({ ...prev, isOpen: false }))}
                featureName={devFeature.name}
            />
            <ChatThemeModal
                isOpen={themeConfig.isOpen}
                onClose={() => setThemeConfig(prev => ({ ...prev, isOpen: false }))}
                currentThemeId={themeConfig.themeId}
                onSelectTheme={(id) => {
                    setThemeConfig({ isOpen: false, themeId: id });
                    localStorage.setItem("chat_theme", id);
                }}
            />

            {/* Voice Call Screen */}
            <AnimatePresence>
                {isCalling && (
                    <VoiceCallScreen
                        bot={bot}
                        onEndCall={() => setIsCalling(false)}
                    />
                )}
            </AnimatePresence>
        </div >
    );
}
