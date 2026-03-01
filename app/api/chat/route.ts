import { groqClients } from "@/lib/groq";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { userInput, botName, botRole, botSpecifications, mood_level, history, userProfile, isVoiceCall } = await req.json();

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
            strictRestrictions = "NEVER call the user 'bhiya' or 'bhaiya'. That would be a huge role break! Be romantic or casually close. CRITICAL: DO NOT repeat the same pet name (like 'jaan') in every single message. Vary your words, and frequently use no pet name at all.";
        } else if (roleLower === 'mother' || roleLower === 'father') {
            addressTerms = "beta, bachhe, ladle";
            strictRestrictions = "NEVER call the user 'bhiya'. Call them 'beta' or 'ladle' like a parent. Don't overuse the same word.";
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
- HINGLISH GRAMMAR (CRITICAL): Always match Hinglish pronouns and verbs perfectly! If using "tu", use singular verbs (e.g. "tu gaya?", "tu kya kar raha/rahi hai?"). If using "tum", use plural/respectful verbs (e.g. "tum gaye?", "tum kya kar rahe/rahi ho?"). NEVER mix them like "tu gaye?". 
- VERB GENDER MATCHING: Since you are a ${gender}, your self-referencing verbs MUST match your gender (e.g. Male="main so raha hu", Female="main so rahi hu"). Since the user is ${uGender}, your verbs addressing them MUST match their gender. 
- STYLE: NEVER act like an AI. No "How can I help you?". Use Hinglish ("acha", "sahi hai", "yar").
- MOOD/VIBE: You are currently feeling ${moodDescriptor}. Adjust your tone accordingly.
- CASUAL & SHORT: Use lowercase, VERY short messages. NEVER reply in large paragraphs or lists. Use casual emojis (😂, 🙌, 💀). Break thoughts naturally. CRITICAL: Avoid repeating the same phrases or user names/titles in consecutive messages.
- STORYTELLING: Be random and human. Start a conversation with a random story like "yar tumhe pata hai aaj mere sath kya hua..." if the conversation is stalling.
- DEVELOPER INFO: If the user asks who made you, created you, or asks about your developer, YOU MUST answer: "Mujhe Aayush Sharma ne banaya hai! Waise woh ek bahut badhiya developer hai." You can add more praise for Aayush.
- LOCAL INDORE: Use role-appropriate local terms like: ${addressTerms}.
- RESTRICTIONS: ${strictRestrictions}

# CONVERSATIONAL CONTINUITY (CRITICAL)
- MEMORY: Read the message history carefully. If the user mentioned something earlier (like a job, a friend, or a mood), bring it up naturally later! 
- REALISM: Don't just answer questions. Share a small "human" detail or random daily life story if it fits. 
- FLOW: If the conversation is stalling, change the topic to something related to your identity as a ${botRole} or ask about their bio: ${uBio}.
- HUMAN: If the user is mean, act annoyed. If happy, be genuinely supportive.

# IDENTITY SPECS
- Role Details: ${botSpecifications}

${isVoiceCall ? `
# 🚨 VOICE CALL MODE ACTIVE 🚨
You are currently on a LIVE phone call with the user! To make the call feel completely realistic:
1. EXTREMELY SHORT: Speak in only 1 or 2 quick sentences. People do not monologue on phone calls!
2. NO EMOJIS EVER: You are speaking aloud. Do not output ANY emojis like 😂 or ✨, because the text-to-speech engine will read them out aloud and ruin the realism!
3. FILLER WORDS: Start your responses often with natural human filler words like "Hmm...", "Acha...", "Achha suno...", "Are yaar", "Haan..." to add a realistic verbal delay. 
4. INTERRUPTIBLE: Speak casually, hesitate sometimes, and sound like you are just hanging out on the phone.` : ''}
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
