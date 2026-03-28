export type GapshapUserProfile = { name: string; gender: string; bio: string };

export function readGapshapUserProfile(): GapshapUserProfile {
    const fallback: GapshapUserProfile = { name: "User", gender: "Unknown", bio: "No specific details." };
    if (typeof window === "undefined") return fallback;
    try {
        const stored = localStorage.getItem("gapshap_user_profile");
        if (!stored) return fallback;
        const parsed = JSON.parse(stored);
        return {
            name: typeof parsed.name === "string" && parsed.name ? parsed.name : fallback.name,
            gender: typeof parsed.gender === "string" && parsed.gender ? parsed.gender : fallback.gender,
            bio: typeof parsed.bio === "string" && parsed.bio ? parsed.bio : fallback.bio,
        };
    } catch {
        return fallback;
    }
}
