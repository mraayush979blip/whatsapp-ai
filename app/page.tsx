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
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<ChatBot | null>(null);

    useEffect(() => {
        // Load session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
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

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

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
            <main className="min-h-screen bg-[#D1D7DB] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#075E54] border-t-transparent rounded-full animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#D1D7DB] flex items-center justify-center p-0 md:p-4 transition-colors duration-500">
            <div className="w-full h-[100dvh] md:max-w-[450px] md:h-[90vh] md:rounded-xl shadow-2xl overflow-hidden relative bg-white flex flex-col">
                {!session ? (
                    <LoginScreen />
                ) : selectedChat ? (
                    <ChatInterface
                        bot={selectedChat}
                        onBack={() => setSelectedChat(null)}
                        onBotDeleted={() => {
                            setSelectedChat(null);
                            // The ChatList will automatically refresh because it fetches on mount
                        }}
                    />
                ) : (
                    <ChatList userId={session.user.id} onSelectChat={(bot) => setSelectedChat(bot)} />
                )}

                {/* Mobile Decorator */}
                <div className="absolute top-0 left-0 w-full h-[5px] bg-[#075e54cc] md:hidden pointer-events-none z-50" />
            </div>
        </main>
    );
}
