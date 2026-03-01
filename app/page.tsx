"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ChatInterface from "@/components/ChatInterface";
import LoginScreen from "@/components/LoginScreen";
import { Session } from "@supabase/supabase-js";
import ChatList from "@/components/ChatList";
import { MessageSquare, Phone, CircleDot, Users, Settings, Archive } from "lucide-react";

interface ChatBot {
    id: string;
    name: string;
    role: string;
    avatar_url: string;
    specifications: string;
    mood_level: number;
}

export default function Home() {
    const [session, setSession] = useState<Session | null>(null);
    const [selectedChat, setSelectedChat] = useState<ChatBot | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
                setSession(session);
                // We only stop loading here if a session exists immediately
                if (session) setLoading(false);
            }
        };

        checkSession();

        // Sync with auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (mounted) {
                setSession(session);
                // Important: we also stop loading on INITIAL_SESSION or SIGNED_IN from the auth state change
                setLoading(false);
            }
        });

        // Load last active chat from localStorage on refresh
        const savedChat = localStorage.getItem("last_chat");
        if (savedChat) {
            try {
                setSelectedChat(JSON.parse(savedChat));
            } catch (e) {
                console.error("Failed to parse saved chat", e);
            }
        }

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // 🔄 Sync selectedChat to localStorage
    useEffect(() => {
        if (selectedChat) {
            localStorage.setItem("last_chat", JSON.stringify(selectedChat));
        } else {
            localStorage.removeItem("last_chat");
        }
    }, [selectedChat]);

    if (loading) {
        return (
            <main className="min-h-[100dvh] bg-[#f0f2f5] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#008069] border-t-transparent rounded-full animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-[100dvh] bg-[#f0f2f5] flex items-center justify-center p-0 md:py-4 lg:py-8 overflow-hidden">
            {/* Desktop Background Strip */}
            <div className="hidden md:block absolute top-0 left-0 w-full h-[127px] bg-[#00a884] -z-10" />

            <div className="w-full h-[100dvh] md:w-full md:max-w-none lg:max-w-[1600px] lg:w-[95vw] md:h-[95vh] lg:rounded-md shadow-2xl overflow-hidden relative bg-white flex flex-row border-0 md:border border-gray-600 m-0 lg:mx-auto">
                {!session ? (
                    <div className="w-full md:max-w-[450px] mx-auto h-full shadow-2xl">
                        <LoginScreen />
                    </div>
                ) : (
                    <>
                        {/* Native Desktop Leftmost Navigation Sidebar (Hidden on mobile) */}
                        <div className="hidden md:flex w-[60px] bg-[#202c33] border-r border-[#2f3b43] h-full flex-col items-center py-4 flex-shrink-0 z-20">
                            {/* Top Icons */}
                            <div className="flex flex-col space-y-4 w-full items-center">
                                <button className="p-2.5 rounded-full hover:bg-[#374248] text-gray-300 relative">
                                    <MessageSquare className="w-6 h-6 fill-transparent" />
                                    <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#00a884] rounded-full border-2 border-[#202c33]" />
                                </button>
                                <button className="p-2.5 rounded-full hover:bg-[#374248] text-gray-300">
                                    <Phone className="w-6 h-6" />
                                </button>
                                <button className="p-2.5 rounded-full hover:bg-[#374248] text-gray-300">
                                    <CircleDot className="w-6 h-6" />
                                </button>
                                <button className="p-2.5 rounded-full hover:bg-[#374248] text-gray-300">
                                    <Users className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1" />

                            {/* Bottom Icons */}
                            <div className="flex flex-col space-y-4 w-full items-center">
                                <button className="p-2.5 rounded-full hover:bg-[#374248] text-gray-300">
                                    <Archive className="w-6 h-6" />
                                </button>
                                <button className="p-2.5 rounded-full hover:bg-[#374248] text-gray-300">
                                    <Settings className="w-6 h-6" />
                                </button>
                                <button className="p-1 rounded-full hover:bg-[#374248] mt-2 mb-2">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-500">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`} alt="Profile" className="w-full h-full object-cover" />
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Middle column: ChatList (hidden on mobile if chat selected, visible on md+) */}
                        <div className={`w-full md:w-[350px] lg:w-[400px] flex-shrink-0 border-r border-[#d1d7db] md:border-[#2f3b43] bg-white md:bg-[#111b21] h-full flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                            <ChatList userId={session.user.id} onSelectChat={(bot) => setSelectedChat(bot)} selectedChatId={selectedChat?.id} />
                        </div>

                        {/* Right column (hidden on mobile if no chat selected, visible on md+) */}
                        <div className={`flex-1 bg-white md:bg-[#222e35] h-full flex-col relative ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                            {selectedChat ? (
                                <ChatInterface
                                    bot={selectedChat}
                                    onBack={() => setSelectedChat(null)}
                                    onBotDeleted={() => setSelectedChat(null)}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center bg-[#f0f2f5] md:bg-[#222e35] p-8 border-b-8 border-[#00a884] md:border-transparent">
                                    <div className="w-80 h-40 mb-8 max-w-full opacity-[0.6] brightness-75 md:brightness-[0.4]">
                                        <img src="https://assets.dryicons.com/uploads/icon/svg/7716/09eedd74-ea9b-44fe-9891-b38a7c25eb48.svg" alt="WhatsApp Web" className="w-full h-full object-contain opacity-50 grayscale" />
                                    </div>
                                    <h1 className="text-3xl font-light text-[#41525d] md:text-[#e9edef] mt-8 mb-4">WhatsApp for Desktop</h1>
                                    <p className="text-[#667781] md:text-[#8696a0] text-sm max-w-md">
                                        Send and receive messages without keeping your phone online.<br />
                                        Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
                                    </p>
                                    <div className="flex-1" />
                                    <p className="text-[#8696a0] md:text-[#667781] flex items-center gap-1 text-xs mb-4">
                                        🔒 End-to-end encrypted
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
