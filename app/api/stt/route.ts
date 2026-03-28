import { NextResponse } from "next/server";

const groqSttKeys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as Blob;

        if (!file) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        if (groqSttKeys.length === 0) {
            return NextResponse.json({ error: "No Groq API key configured" }, { status: 500 });
        }

        let lastErrorText = "";

        for (const apiKey of groqSttKeys) {
            const groqFormData = new FormData();
            groqFormData.append("file", file, "audio.webm");
            groqFormData.append("model", "whisper-large-v3-turbo");
            groqFormData.append("language", "hi");
            groqFormData.append("response_format", "json");

            const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
                body: groqFormData as unknown as BodyInit,
            });

            if (response.ok) {
                const data = await response.json();
                return NextResponse.json({ text: data.text });
            }

            lastErrorText = await response.text();
            console.error("Groq Whisper API error (key attempt):", lastErrorText);
        }

        throw new Error(`Groq STT failed after ${groqSttKeys.length} key(s): ${lastErrorText}`);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Transcription failed";
        console.error("STT Error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
