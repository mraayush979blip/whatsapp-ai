"use client";

import { motion } from "framer-motion";

interface Message {
    role: "user" | "bot";
    content: string;
    time: string;
    type?: "text" | "image" | "audio";
    media_url?: string;
}

export default function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === "user";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`flex mb-2 ${isUser ? "justify-end" : "justify-start"}`}
        >
            <div
                className={`relative max-w-[85%] px-3 py-1.5 rounded-lg shadow-sm text-sm ${isUser
                    ? "bg-[#E7FFDB] rounded-tr-none text-[#111b21]"
                    : "bg-white rounded-tl-none text-[#111b21]"
                    }`}
            >
                {message.type === "image" ? (
                    <div className="mb-1 rounded-lg overflow-hidden border border-gray-100">
                        <img src={message.media_url} alt="Shared photo" className="max-w-full h-auto object-cover max-h-[300px]" />
                    </div>
                ) : message.type === "audio" ? (
                    <div className="mb-1 py-1">
                        <audio controls className="h-8 max-w-[200px]">
                            <source src={message.media_url} type="audio/mpeg" />
                        </audio>
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap leading-tight font-[14.5px]">{message.content}</p>
                )}
                <div className="flex justify-end items-center mt-1 space-x-1">
                    <span className="text-[10px] text-[#8C8C8C] leading-none uppercase">
                        {message.time}
                    </span>
                    {isUser && (
                        <svg
                            viewBox="0 0 16 11"
                            height="11"
                            width="16"
                            preserveAspectRatio="xMidYMid meet"
                            className="fill-[#4FC3F7]"
                        >
                            <path d="M15.01 3.316l-.478-.372a.365.365 0 00-.51.063L8.666 9.88a.32.32 0 01-.484.032l-.358-.325a.319.319 0 00-.484.032l-.378.48a.418.418 0 00.036.54l1.32 1.267a.418.418 0 00.612-.013l7.117-8.037a.365.365 0 00-.029-.507zM.2 5.169l-.478-.372a.365.365 0 00-.51.063L5.617 11.2a.32.32 0 01-.484.032l-.358-.325a.319.319 0 00-.484.032l-.378.48a.418.418 0 00.036.54l1.32 1.267a.418.418 0 00.612-.013l7.117-8.037a.365.365 0 00-.029-.507z" />
                        </svg>
                    )}
                </div>

                {/* Tail positioning */}
                <div
                    className={`absolute top-0 w-2 h-2 ${isUser
                        ? "-right-1.5 bg-[#E7FFDB] [clip-path:polygon(0_0,0_100%,100%_0)]"
                        : "-left-1.5 bg-white [clip-path:polygon(100%_0,100%_100%,0_0)]"
                        }`}
                />
            </div>
        </motion.div>
    );
}
