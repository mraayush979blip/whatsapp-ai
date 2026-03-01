"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, Volume2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceCallScreenProps {
    bot: {
        name: string;
        avatar_url: string;
        role: string;
        specifications: string;
        mood_level: number;
    };
    onEndCall: () => void;
}

export default function VoiceCallScreen({ bot, onEndCall }: VoiceCallScreenProps) {
    const [callStatus, setCallStatus] = useState("Calling...");
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");

    const recognitionRef = useRef<any>(null);
    const deepgramAudioRef = useRef<HTMLAudioElement | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Call Timer & Initial Ringing Simulation
    useEffect(() => {
        const ringTimer = setTimeout(() => {
            setCallStatus("Connected");
            speakInitialGreeting();
        }, 2000);

        let interval: NodeJS.Timeout;
        if (callStatus === "Connected") {
            interval = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        }

        return () => {
            clearTimeout(ringTimer);
            if (interval) clearInterval(interval);
        };
    }, [callStatus]);

    // Format time (MM:SS)
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (deepgramAudioRef.current) {
                deepgramAudioRef.current.pause();
                deepgramAudioRef.current.currentTime = 0;
            }
        };
    }, []);

    // Speech Recognition (Listening) Setup
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'hi-IN'; // Hindi/Hinglish optimal

                recognition.onresult = (event: any) => {
                    if (isMuted) return; // Ignore if muted

                    let currentTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        currentTranscript += event.results[i][0].transcript;
                    }

                    if (event.results[event.results.length - 1].isFinal) {
                        setTranscript(currentTranscript);
                        handleUserSaid(currentTranscript);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error("Speech Recognition Error", event.error);
                    if (event.error === 'no-speech') {
                        // Restart listening silently
                        try { recognition.stop(); } catch (e) { }
                        setTimeout(() => { if (!isMuted && callStatus === "Connected") { try { recognition.start() } catch (e) { } } }, 1000);
                    }
                };

                recognition.onend = () => {
                    // Auto-restart if call is still active and not muted
                    if (callStatus === "Connected" && !isMuted) {
                        try { recognition.start(); } catch (e) { }
                    }
                };

                recognitionRef.current = recognition;
            } else {
                alert("Your browser doesn't support Voice Calls! Try Chrome or Safari.");
                onEndCall();
            }
        }

        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) { }
            }
        };
    }, [isMuted, callStatus]);

    // Start/Stop listening based on Mute state
    useEffect(() => {
        if (callStatus === "Connected" && recognitionRef.current) {
            if (isMuted) {
                try { recognitionRef.current.stop(); setIsListening(false); } catch (e) { }
            } else {
                try { recognitionRef.current.start(); setIsListening(true); } catch (e) { }
            }
        }
    }, [isMuted, callStatus]);

    const speakInitialGreeting = () => {
        const greeting = `Hello? Oye main ${bot.name} bol rahi hu.`;
        speakText(greeting);
    };

    const speakText = async (text: string) => {
        // Stop listening while speaking so the bot doesn't hear itself!
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
            setIsListening(false);
        }

        // Determine intended gender based on the bot's role
        const femaleRoles = ['girlfriend', 'mother', 'sister', 'teacher', 'wife', 'aunt', 'girl', 'woman', 'best friend (female)', 'female'];
        const roleLower = (bot.role || '').toLowerCase();
        const isFemale = femaleRoles.includes(roleLower);

        try {
            // First try high-quality Deepgram TTS API
            const response = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, isFemale })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);

                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    deepgramAudioRef.current = null;
                    // Resume listening after speaking
                    if (!isMuted && callStatus === "Connected" && recognitionRef.current) {
                        try { recognitionRef.current.start(); setIsListening(true); } catch (e) { }
                    }
                };

                if (deepgramAudioRef.current) {
                    deepgramAudioRef.current.pause();
                }
                deepgramAudioRef.current = audio;

                audio.play().catch(e => {
                    console.error("Audio playback blocked by browser:", e);
                });
                return;
            } else {
                console.warn("Deepgram TTS failed:", await response.text());
                // Fallback action if needed (e.g. show an error toast) but no native voice
            }
        } catch (error) {
            console.error("Error with Deepgram TTS:", error);
        }
    };

    const handleUserSaid = async (text: string) => {
        if (!text.trim()) return;

        setCallStatus("Thinking...");

        try {
            // Send to our existing Chat API (We just send the last text, no history for simplicity in calls)
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userInput: text + " (Note: This is a phone call, so reply playfully and purely verbally. Keep it extremely short, 1 or 2 lines max.)",
                    botName: bot.name,
                    botRole: bot.role,
                    botSpecifications: bot.specifications,
                    mood_level: bot.mood_level,
                    history: [],
                    userProfile: {}
                }),
            });

            const data = await response.json();
            setCallStatus("Connected");

            // Speak the response!
            if (data.content) {
                speakText(data.content);
            }

        } catch (error) {
            console.error("API Error during call:", error);
            setCallStatus("Connected");
            speakText("Arre network chala gaya kya?");
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[200] bg-[#1a2327] flex flex-col items-center justify-between font-sans"
        >
            {/* Call Header */}
            <div className="w-full pt-12 pb-6 flex flex-col items-center z-10">
                <div className="flex items-center text-[#8696a0] mb-6">
                    <span className="text-sm font-medium tracking-wide">🔒 End-to-end encrypted</span>
                </div>

                <h1 className="text-[#e9edef] text-3xl font-normal mb-2 tracking-tight">
                    {bot.name}
                </h1>

                <p className="text-[#8696a0] text-lg">
                    {callStatus === "Connected" ? formatTime(callDuration) : callStatus}
                </p>

                {/* Listening visualizer */}
                {isListening && callStatus === "Connected" && (
                    <div className="mt-4 flex space-x-1">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ height: ["4px", "12px", "4px"] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                                className="w-1.5 bg-[#00a884] rounded-full"
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Profile Picture / Avatar */}
            <div className="flex-1 flex items-center justify-center w-full relative">
                {/* Background Ripple Effect */}
                {(isListening || callStatus === "Calling...") && !isMuted && (
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-[#00a884]/20 z-0"
                    />
                )}

                <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full overflow-hidden shadow-2xl border-2 border-[#202c33] z-10 relative">
                    <img
                        src={bot.avatar_url}
                        alt={bot.name}
                        className={`w-full h-full object-cover transition-all ${callStatus === "Calling..." ? "opacity-80 scale-105" : "opacity-100 scale-100"}`}
                    />

                    {/* Muted overlay icon on avatar */}
                    {isMuted && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                            <MicOff className="w-12 h-12 text-white/80" />
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Controls Panel */}
            <div className="w-full bg-[#202c33] rounded-t-3xl pt-8 pb-10 px-8 flex justify-around items-center z-10 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
                {/* Mute Button */}
                <button
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-[#111b21]' : 'bg-[#374248] text-white hover:bg-[#4a555b]'} active:scale-90`}
                >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                {/* End Call Button */}
                <button
                    onClick={() => {
                        if (deepgramAudioRef.current) {
                            deepgramAudioRef.current.pause();
                            deepgramAudioRef.current.currentTime = 0;
                        }
                        onEndCall();
                    }}
                    className="w-[72px] h-[72px] rounded-full bg-[#f15c6d] flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
                >
                    <PhoneOff className="w-8 h-8" />
                </button>

                {/* Speaker Toggle (Mock) */}
                <button
                    className="w-14 h-14 rounded-full bg-[#374248] flex items-center justify-center text-white hover:bg-[#4a555b] active:scale-90 transition-transform"
                >
                    <Volume2 className="w-6 h-6" />
                </button>
            </div>

            {/* Add User Mock Button */}
            <button className="absolute top-10 right-6 p-3 rounded-full bg-black/20 text-white active:bg-black/40 transition-colors z-20">
                <Plus className="w-6 h-6" />
            </button>
        </motion.div>
    );
}
