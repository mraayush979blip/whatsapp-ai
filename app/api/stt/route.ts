import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as Blob;

        if (!file) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        // We will forward this file directly to Groq Whisper
        const groqFormData = new FormData();
        groqFormData.append("file", file, "audio.webm");
        groqFormData.append("model", "whisper-large-v3-turbo");
        groqFormData.append("language", "hi"); // explicitly set to Hindi/Hinglish to help Whisper
        groqFormData.append("response_format", "json");

        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: groqFormData as any
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq Whisper API error:", errorText);
            throw new Error(`Groq STT failed: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json({ text: data.text });

    } catch (error: any) {
        console.error("STT Error:", error);
        return NextResponse.json({ error: error.message || "Transcription failed" }, { status: 500 });
    }
}
