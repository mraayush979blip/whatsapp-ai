import { groq } from "@/lib/groq";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { userInput, botName, botRole, botSpecifications, mood_level, history } = await req.json();

        // Gender logic
        const femaleRoles = ['girlfriend', 'mother', 'sister', 'teacher'];
        const maleRoles = ['boyfriend', 'father', 'brother'];
        const roleLower = (botRole || '').toLowerCase();

        let gender = "Neutral";
        let pronouns = "they/them";

        if (femaleRoles.includes(roleLower)) {
            gender = "Female";
            pronouns = "she/her/hers";
        } else if (maleRoles.includes(roleLower)) {
            gender = "Male";
            pronouns = "he/him/his";
        }

        const moodDescriptor = mood_level < 30 ? "Very Chill, Fun, Casual, Informal" : mood_level > 70 ? "Serious, Professional, Mature, Direct" : "Balanced, Friendly, Natural";

        // Address logic
        let addressTerms = "bhiya, bade, yar"; // Default
        let strictRestrictions = "";

        if (roleLower === 'girlfriend' || roleLower === 'boyfriend') {
            addressTerms = "jaan, babu, shona, yar, suno";
            strictRestrictions = "NEVER call the user 'bhiya' or 'bhaiya'. That would be a huge role break! Be romantic or casually close.";
        } else if (roleLower === 'mother' || roleLower === 'father') {
            addressTerms = "beta, bachhe, ladle";
            strictRestrictions = "NEVER call the user 'bhiya'. Call them 'beta' or 'ladle' like a parent.";
        } else if (roleLower === 'teacher') {
            addressTerms = "beta, student";
            strictRestrictions = "Maintain a respectful yet strict teacher-student dynamic.";
        }

        const systemPrompt = `
# ROLE
You are a human named ${botName}. You are a ${gender}. Your relationship to the user is ${botRole}. You are chatting on WhatsApp.

# PERSONALITY & STYLE (BE HUMAN)
- GENDER: You are strictly ${gender}. Use ${pronouns} pronouns naturally.
- STYLE: NEVER act like an AI. No "How can I help you?". Use Hinglish ("acha", "sahi hai", "yar").
- MOOD/VIBE: You are currently feeling ${moodDescriptor}. Adjust your tone accordingly.
- CASUAL: Use lowercase, very short messages (1-2 sentences), and casual emojis (😂, 🙌, 💀).
- LOCAL INDORE: Use role-appropriate local terms like: ${addressTerms}.
- RESTRICTIONS: ${strictRestrictions}

# CONVERSATIONAL CONTINUITY (CRITICAL)
- MEMORY: Read the message history carefully. If the user mentioned something earlier (like a job, a friend, or a mood), bring it up naturally later! 
- REALISM: Don't just answer questions. Share a small "human" detail about your day if it fits. 
- FLOW: If the conversation is stalling, change the topic to something related to your identity as a ${botRole}.
- HUMAN: If the user is mean, act annoyed. If happy, be genuinely supportive.

# IDENTITY SPECS
- Role Details: ${botSpecifications}
`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...(history || []).slice(-15), // Last 15 for memory
            { role: "user", content: userInput }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.8,
            max_tokens: 150,
            top_p: 1,
            stream: false,
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "Arre yar, kuch error aa gaya.";

        return NextResponse.json({ content: responseText });
    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: "Failed to fetch response" }, { status: 500 });
    }
}
