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
        <main className="min-h-[100dvh] bg-[#f0f2f5] flex items-center justify-center p-0 md:py-8 overflow-hidden">
            {/* Desktop Background Strip */}
            <div className="hidden md:block absolute top-0 left-0 w-full h-[127px] bg-[#00a884] -z-10" />

            <div className="w-full h-[100dvh] md:max-w-[450px] md:h-[90vh] md:rounded-lg shadow-2xl overflow-hidden relative bg-white flex flex-col border border-gray-100">
                {!session ? (
                    <LoginScreen />
                ) : selectedChat ? (
                    <ChatInterface
                        bot={selectedChat}
                        onBack={() => setSelectedChat(null)}
                        onBotDeleted={() => {
                            setSelectedChat(null);
                        }}
                    />
                ) : (
                    <ChatList userId={session.user.id} onSelectChat={(bot) => setSelectedChat(bot)} />
                )}
            </div>
        </main>
    );
}
