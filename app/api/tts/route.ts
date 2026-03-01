import { NextResponse } from "next/server";

const DEEPGRAM_KEYS = [
    "a38337c12f4f44964882acfe0817d89ef53afccf",
    "845c36b327fe1d0d19a1d03eb548a79c16d30884"
];

export async function POST(req: Request) {
    try {
        const { text, isFemale } = await req.json();

        // Deepgram Aura Voices:
        // Female conversational: aura-asteria-en, aura-luna-en, aura-stella-en, aura-hera-en
        // Male conversational: aura-orion-en, aura-arcas-en, aura-perseus-en
        const voice = isFemale ? "aura-asteria-en" : "aura-orion-en";

        let audioBuffer: ArrayBuffer | null = null;
        let lastError = null;

        for (const key of DEEPGRAM_KEYS) {
            try {
                const response = await fetch(`https://api.deepgram.com/v1/speak?model=${voice}&encoding=mp3`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${key}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text })
                });

                if (response.ok) {
                    audioBuffer = await response.arrayBuffer();
                    break;
                } else {
                    const errorMsg = await response.text();
                    lastError = new Error(`Deepgram API error: ${response.status} ${errorMsg}`);
                    console.error("Deepgram key failed:", lastError.message);
                }
            } catch (err) {
                lastError = err;
                console.error("Deepgram request failed:", err);
            }
        }

        if (!audioBuffer) {
            throw lastError || new Error("All Deepgram keys failed.");
        }

        return new NextResponse(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
            }
        });

    } catch (error: any) {
        console.error("TTS Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate TTS" }, { status: 500 });
    }
}
