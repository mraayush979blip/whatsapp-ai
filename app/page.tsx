"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ChatInterface from "@/components/ChatInterface";
import LoginScreen from "@/components/LoginScreen";
import { Session } from "@supabase/supabase-js";
import ChatList from "@/components/ChatList";

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
        // Load session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Sync with auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
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

        return () => subscription.unsubscribe();
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

            <div className="w-full h-[100dvh] md:w-full md:max-w-none lg:max-w-[1600px] lg:w-[95vw] md:h-[95vh] lg:rounded-tl-sm lg:rounded-tr-sm lg:rounded-bl-sm lg:rounded-br-sm shadow-2xl overflow-hidden relative bg-white flex flex-row border-0 md:border border-gray-100 m-0 lg:mx-auto">
                {!session ? (
                    <div className="w-full md:max-w-[450px] mx-auto h-full shadow-2xl">
                        <LoginScreen />
                    </div>
                ) : (
                    <>
                        {/* Left column (hidden on mobile if chat selected, visible on md+) */}
                        <div className={`w-full md:w-[30%] lg:w-[400px] flex-shrink-0 border-r border-[#d1d7db] bg-white h-full flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                            <ChatList userId={session.user.id} onSelectChat={(bot) => setSelectedChat(bot)} selectedChatId={selectedChat?.id} />
                        </div>

                        {/* Right column (hidden on mobile if no chat selected, visible on md+) */}
                        <div className={`flex-1 bg-[#f0f2f5] h-full flex-col relative ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                            {selectedChat ? (
                                <ChatInterface
                                    bot={selectedChat}
                                    onBack={() => setSelectedChat(null)}
                                    onBotDeleted={() => setSelectedChat(null)}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center bg-[#f0f2f5] p-8 border-b-8 border-[#25D366]">
                                    <div className="w-80 h-40 mb-8 max-w-full opacity-[0.6]">
                                        <img src="https://assets.dryicons.com/uploads/icon/svg/7716/09eedd74-ea9b-44fe-9891-b38a7c25eb48.svg" alt="WhatsApp Web" className="w-full h-full object-contain opacity-50 grayscale" />
                                    </div>
                                    <h1 className="text-3xl font-light text-[#41525d] mt-8 mb-4">WhatsApp for Desktop</h1>
                                    <p className="text-[#667781] text-sm max-w-md">
                                        Send and receive messages without keeping your phone online.<br />
                                        Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
                                    </p>
                                    <div className="flex-1" />
                                    <p className="text-[#8696a0] flex items-center gap-1 text-xs mb-4">
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
