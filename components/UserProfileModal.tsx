import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Save } from "lucide-react";

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
    const [name, setName] = useState("");
    const [gender, setGender] = useState("");
    const [bio, setBio] = useState("");

    useEffect(() => {
        if (isOpen) {
            const profile = localStorage.getItem("gapshap_user_profile");
            if (profile) {
                try {
                    const parsed = JSON.parse(profile);
                    setName(parsed.name || "");
                    setGender(parsed.gender || "");
                    setBio(parsed.bio || "");
                } catch (e) { }
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        const profile = { name, gender, bio };
        localStorage.setItem("gapshap_user_profile", JSON.stringify(profile));
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative"
                >
                    <div className="bg-[#008069] p-5 text-center relative">
                        <User className="w-8 h-8 text-white mx-auto mb-2 opacity-90" />
                        <h2 className="text-xl font-bold text-white tracking-tight">Your Details</h2>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1 rounded-full text-white/80 hover:bg-white/10 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-5 flex flex-col space-y-4 bg-[#f0f2f5]">
                        <div>
                            <label className="block text-sm font-semibold text-[#111b21] mb-1">Your Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Aayush"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#008069] shadow-sm text-[#111b21] placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#111b21] mb-1">Your Gender</label>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#008069] shadow-sm bg-white text-[#111b21]"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#111b21] mb-1">About You (Optional)</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="e.g. I am a developer. I love coffee."
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#008069] shadow-sm resize-none text-[#111b21] placeholder-gray-400"
                                rows={2}
                            />
                            <p className="text-[11px] text-[#667781] mt-1.5 leading-tight">Bots will use this info to reply in a better, personalized way!</p>
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full bg-[#008069] hover:bg-[#006e5a] text-white py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition-all flex items-center justify-center mt-2"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Save Profile
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
