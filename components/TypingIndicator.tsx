"use client";

import { motion } from "framer-motion";

export default function TypingIndicator({ botName }: { botName: string }) {
    return (
        <div className="flex items-center space-x-2 px-3 py-1 mb-2">
            <div className="bg-white rounded-lg rounded-tl-none px-3 py-1.5 shadow-sm">
                <div className="flex space-x-1">
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                        className="w-1.5 h-1.5 bg-[#8C8C8C] rounded-full"
                    />
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                        className="w-1.5 h-1.5 bg-[#8C8C8C] rounded-full"
                    />
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                        className="w-1.5 h-1.5 bg-[#8C8C8C] rounded-full"
                    />
                </div>
            </div>
            <span className="text-[11px] text-[#00000080] font-semibold italic">
                {botName} is typing...
            </span>
        </div>
    );
}
