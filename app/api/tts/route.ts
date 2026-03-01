import { NextResponse } from "next/server";

const ELEVENLABS_KEYS = [
    process.env.ELEVENLABS_API_KEY,
    process.env.ELEVENLABS_API_KEY_2
].filter(Boolean);

export async function POST(req: Request) {
    try {
        const { text, isFemale } = await req.json();

        // ElevenLabs Voices
        // Rachel (Female): 21m00Tcm4TlvDq8ikWAM
        // Josh (Male): TxGEqnHWrfWFTfGW9XjX
        const voiceId = isFemale ? "21m00Tcm4TlvDq8ikWAM" : "TxGEqnHWrfWFTfGW9XjX";

        let audioBuffer: ArrayBuffer | null = null;
        let lastError = null;

        for (const key of ELEVENLABS_KEYS) {
            try {
                const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                    method: 'POST',
                    headers: {
                        'xi-api-key': key as string,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text,
                        model_id: "eleven_multilingual_v2", // crucial for Hindi
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75
                        }
                    })
                });

                if (response.ok) {
                    audioBuffer = await response.arrayBuffer();
                    break;
                } else {
                    const errorMsg = await response.text();
                    lastError = new Error(`ElevenLabs API error: ${response.status} ${errorMsg}`);
                    console.error("ElevenLabs key failed:", lastError.message);
                }
            } catch (err) {
                lastError = err;
                console.error("ElevenLabs request failed:", err);
            }
        }

        if (!audioBuffer) {
            throw lastError || new Error("All ElevenLabs keys failed.");
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
