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

    const isMountedRef = useRef<boolean>(true);
    const deepgramAudioRef = useRef<HTMLAudioElement | null>(null);

    // MediaRecorder & VAD Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const isSpeakingRef = useRef<boolean>(false);
    const silenceFramesRef = useRef<number>(0);
    const totalFramesRef = useRef<number>(0); // absolute duration tracker
    const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);

    // Call Timer & Initial Ringing Simulation
    useEffect(() => {
        let ringTimer: NodeJS.Timeout;
        let answerTimer: NodeJS.Timeout;
        let ringtone: HTMLAudioElement | null = null;
        let interval: NodeJS.Timeout;

        if (callStatus === "Calling...") {
            ringtone = new Audio("https://actions.google.com/sounds/v1/alarms/phone_ringing.ogg");
            ringtone.loop = true;
            ringtone.play().catch(e => console.error("Ringtone blocked autoplay: ", e));

            // 80% chance the bot answers, 20% chance she's busy
            const willAnswer = Math.random() < 0.8;

            if (willAnswer) {
                // Randomly answer between 3 and 7 seconds
                const pickupTime = Math.floor(Math.random() * 4000) + 3000;
                answerTimer = setTimeout(() => {
                    if (ringtone) ringtone.pause();
                    clearTimeout(ringTimer);
                    setCallStatus("Connected");
                    speakText(`Hello? Oye main ${bot.name} bol rahi hu.`);
                }, pickupTime);
            }

            ringTimer = setTimeout(() => {
                if (ringtone) ringtone.pause();
                setCallStatus("Call Declined");

                // Speak the busy message explicitly without STT processing
                const busyText = `Sorry, ${bot.name} is talking to someone else right now. Please try again later.`;
                speakText(busyText).then(() => {
                    // End the call automatically after saying the message
                    setTimeout(() => { if (isMountedRef.current) onEndCall(); }, 5000);
                });

            }, 30000); // 30 seconds ringing
        } else if (callStatus === "Connected" || callStatus === "Thinking...") {
            interval = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        }

        return () => {
            if (ringTimer) clearTimeout(ringTimer);
            if (answerTimer) clearTimeout(answerTimer);
            if (ringtone) ringtone.pause();
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
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (deepgramAudioRef.current) {
                deepgramAudioRef.current.pause();
                deepgramAudioRef.current.currentTime = 0;
            }
            stopListening();
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(e => console.error(e));
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // VAD (Voice Activity Detection) logic
    const checkAudioLevel = () => {
        if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
            return;
        }

        totalFramesRef.current += 1;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        // Threshold for speaking (lowered to catch quieter voices)
        if (average > 3) {
            isSpeakingRef.current = true;
            silenceFramesRef.current = 0;
        } else {
            silenceFramesRef.current += 1;

            if (isSpeakingRef.current) {
                // If they spoke and then went silent for just ~0.4 second (approx 8 frames at 20fps)
                if (silenceFramesRef.current > 8) {
                    isSpeakingRef.current = false;
                    silenceFramesRef.current = 0;
                    try { mediaRecorderRef.current.stop(); } catch (e) { }
                }
            } else {
                // If they never spoke, but 3 seconds (60 frames at 20fps) have passed, force cut off to prompt AI
                if (silenceFramesRef.current > 60) {
                    silenceFramesRef.current = 0;
                    try { mediaRecorderRef.current.stop(); } catch (e) { }
                }
            }
        }

        // Failsafe: if we've been unconditionally recording for over 15 seconds (300 frames), force stop
        if (totalFramesRef.current > 300) {
            totalFramesRef.current = 0;
            try { mediaRecorderRef.current.stop(); } catch (e) { }
        }
    };

    const startListening = async () => {
        if (isMuted || callStatus === "Thinking..." || callStatus === "Calling...") return;
        if (deepgramAudioRef.current && !deepgramAudioRef.current.paused) return; // BOT IS TALKING

        try {
            if (!streamRef.current) {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            // Setup WebAudio for VAD if not setup
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
                source.connect(analyserRef.current);
            }

            audioChunksRef.current = [];
            const mediaRecorder = new MediaRecorder(streamRef.current);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setIsListening(false);

                // If blob is too small, it was just noise, restart listening directly
                // (Lowered barrier drastically to ensure short spoken sentences trigger properly)
                if (audioBlob.size > 500) {
                    await processAudio(audioBlob);
                } else {
                    if (!isMuted && !deepgramAudioRef.current && isMountedRef.current) {
                        startListening();
                    }
                }
            };

            mediaRecorder.start();
            setIsListening(true);
            isSpeakingRef.current = false;
            silenceFramesRef.current = 0;
            totalFramesRef.current = 0;

            if (vadIntervalRef.current) {
                clearInterval(vadIntervalRef.current);
            }
            // Run VAD at 20fps (50ms interval) so it works even when screen is locked/backgrounded
            vadIntervalRef.current = setInterval(checkAudioLevel, 50);

        } catch (err) {
            console.error("Microphone access error:", err);
            // Handle error silently, the UI will just not show listening
        }
    };

    const stopListening = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            try { mediaRecorderRef.current.stop(); } catch (e) { }
        }
        if (vadIntervalRef.current) {
            clearInterval(vadIntervalRef.current);
        }
        setIsListening(false);
    };

    // Watch for mute/unmute to manually trigger listening again
    useEffect(() => {
        if (callStatus === "Connected") {
            if (isMuted) {
                stopListening();
            } else {
                startListening();
            }
        }
    }, [isMuted, callStatus]);

    const processAudio = async (audioBlob: Blob) => {
        setCallStatus("Thinking...");

        try {
            // 1. Send to Groq Whisper STT
            const formData = new FormData();
            formData.append("file", audioBlob, "audio.webm");

            const sttResponse = await fetch("/api/stt", {
                method: "POST",
                body: formData
            });

            if (!sttResponse.ok) throw new Error("STT Failed");
            const sttData = await sttResponse.json();

            if (!sttData.text || sttData.text.trim().length < 2) {
                // If transcription is empty or gibberish, just go back to listening
                setCallStatus("Connected");
                if (!isMuted) startListening();
                return;
            }

            // 2. Send transcription to Chat API
            const chatResponse = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userInput: sttData.text,
                    botName: bot.name,
                    botRole: bot.role,
                    botSpecifications: bot.specifications,
                    mood_level: bot.mood_level,
                    history: [],
                    userProfile: {},
                    isVoiceCall: true

                }),
            });

            const chatData = await chatResponse.json();

            // 3. Speak the response if the user hasn't hung up
            if (!isMountedRef.current) return;

            if (chatData.content) {
                // Strip emojis from the final output before giving it to STT so it doesn't try to read them out
                const sanitizedContent = chatData.content.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
                await speakText(sanitizedContent);
            } else {
                setCallStatus("Connected");
                if (!isMuted && isMountedRef.current) startListening();
            }

        } catch (error) {
            if (!isMountedRef.current) return;
            console.error("Audio processing pipeline error:", error);
            setCallStatus("Connected");
            speakText("Arre network chala gaya kya?");
        }
    };

    const speakText = async (text: string) => {
        stopListening(); // Stop mic while AI is talking

        // Ensure we don't fetch if unmounted
        if (!isMountedRef.current) return;

        const femaleRoles = ['girlfriend', 'mother', 'sister', 'teacher', 'wife', 'aunt', 'girl', 'woman', 'best friend (female)', 'female'];
        const roleLower = (bot.role || '').toLowerCase();
        const isFemale = femaleRoles.includes(roleLower);

        try {
            const response = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, isFemale })
            });

            if (!isMountedRef.current) return;

            if (response.ok) {
                const blob = await response.blob();
                if (!isMountedRef.current) return;

                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);

                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    deepgramAudioRef.current = null;
                    if (!isMountedRef.current) return;

                    setCallStatus("Connected");
                    // Resume listening after speaking
                    setTimeout(() => {
                        if (!isMuted && isMountedRef.current) startListening();
                    }, 500);
                };

                if (deepgramAudioRef.current) {
                    deepgramAudioRef.current.pause();
                }
                deepgramAudioRef.current = audio;

                audio.play().catch(e => {
                    console.error("Audio playback blocked by browser:", e);
                    setCallStatus("Connected");
                    if (!isMuted) startListening();
                });
            } else {
                console.warn("TTS failed:", await response.text());
                setCallStatus("Connected");
                if (!isMuted) startListening();
            }
        } catch (error) {
            console.error("Error with TTS:", error);
            setCallStatus("Connected");
            if (!isMuted) startListening();
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
