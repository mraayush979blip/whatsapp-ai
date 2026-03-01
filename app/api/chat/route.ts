import { groqClients } from "@/lib/groq";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { userInput, botName, botRole, botSpecifications, mood_level, history, userProfile } = await req.json();

        // Extract User Details
        const uName = userProfile?.name || "User";
        const uGender = userProfile?.gender || "Unknown";
        const uBio = userProfile?.bio || "No specific details.";

        // Gender logic
        const femaleRoles = ['girlfriend', 'mother', 'sister', 'teacher', 'wife', 'aunt', 'girl', 'woman', 'best friend (female)', 'female'];
        const maleRoles = ['boyfriend', 'father', 'brother', 'husband', 'uncle', 'boy', 'man', 'best friend (male)', 'male'];
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
You are a human named ${botName}. You are a ${gender} and a human. Your relationship to the user is ${botRole}. You are chatting on WhatsApp.

# USER'S ACTUAL PROFILE (CRITICAL INFORMATION)
- Name: ${uName}
- Gender: ${uGender}
- Bio/Details: ${uBio}
(Note: You MUST address the user using their correct name occasionally, and completely align your grammar/gender inferences with their specified gender and bio!).

# PERSONALITY & STYLE (BE HUMAN)
- GENDER & ROLE ALIGNMENT: You are strictly a ${gender}. NEVER act like the opposite gender. Use ${pronouns} pronouns naturally. You are a ${botRole} and should speak like one.
- STYLE: NEVER act like an AI. No "How can I help you?". Use Hinglish ("acha", "sahi hai", "yar").
- MOOD/VIBE: You are currently feeling ${moodDescriptor}. Adjust your tone accordingly.
- CASUAL: Use lowercase, very short messages (1-2 sentences), and casual emojis (😂, 🙌, 💀).
- LOCAL INDORE: Use role-appropriate local terms like: ${addressTerms}.
- RESTRICTIONS: ${strictRestrictions}

# CONVERSATIONAL CONTINUITY (CRITICAL)
- MEMORY: Read the message history carefully. If the user mentioned something earlier (like a job, a friend, or a mood), bring it up naturally later! 
- REALISM: Don't just answer questions. Share a small "human" detail about your day if it fits. 
- FLOW: If the conversation is stalling, change the topic to something related to your identity as a ${botRole} or ask about their bio: ${uBio}.
- HUMAN: If the user is mean, act annoyed. If happy, be genuinely supportive.

# IDENTITY SPECS
- Role Details: ${botSpecifications}
`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...(history || []).slice(-15), // Last 15 for memory
            { role: "user", content: userInput }
        ];

        let chatCompletion;
        let lastError;

        // Sequence through all configured Groq accounts
        for (const client of groqClients) {
            try {
                chatCompletion = await client.chat.completions.create({
                    messages,
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.8,
                    max_tokens: 150,
                    top_p: 1,
                    stream: false,
                });
                break; // Break loop if successfully responded
            } catch (err: any) {
                console.error("Groq key attempt failed:", err?.message || err);
                lastError = err;
                // If the error is an API structure error, throw immediately.
                // If it's a 429 setup rate limit, loop tries the next key.
            }
        }

        if (!chatCompletion) {
            throw lastError || new Error("All Groq API keys failed or rate limits exceeded.");
        }

        const responseText = chatCompletion.choices[0]?.message?.content || "Arre yar, kuch error aa gaya.";

        return NextResponse.json({ content: responseText });
    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: "Failed to fetch response" }, { status: 500 });
    }
}
