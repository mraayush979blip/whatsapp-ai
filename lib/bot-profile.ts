export type BotGender = "Male" | "Female" | "Neutral";

/** Stable gender for prompts / TTS; Teacher & Friend → Neutral (fixes teacher forced-female). */
export function inferBotGender(role: string): BotGender {
    const r = (role || "").toLowerCase();
    if (["girlfriend", "mother", "sister"].includes(r)) return "Female";
    if (["boyfriend", "father", "brother"].includes(r)) return "Male";
    return "Neutral";
}

/** Fields to send with every /api/chat request from the browser. */
export function clientChatContext(role: string) {
    return {
        botGender: inferBotGender(role),
        clientLocalDate: new Date().toLocaleDateString("en-CA"),
        dailyTopicSeed: Math.floor(Math.random() * 1_000_000_000),
    };
}
