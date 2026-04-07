import { groqClients } from "@/lib/groq";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const {
            userInput,
            botName,
            botRole,
            botSpecifications,
            mood_level,
            history,
            userProfile,
            isVoiceCall,
            isProactiveOpener,
            botGender: botGenderRaw,
            clientLocalDate,
            dailyTopicSeed,
        } = await req.json();

        // Extract User Details
        const uName = userProfile?.name || "User";
        const uGender = userProfile?.gender || "Unknown";
        const uBio = userProfile?.bio || "No specific details.";

        const histArr = (history || []) as { role: string; content: string }[];
        const recentAssistantLines = histArr
            .filter((m) => m.role === "assistant")
            .slice(-6)
            .map((m) => m.content || "")
            .filter(Boolean);
        const antiRepeatBlock =
            recentAssistantLines.length > 0
                ? `
# DO NOT REPEAT (CRITICAL)
You recently said the lines below. Do NOT reuse them, repeat the same opener, or paraphrase them in your next reply. Move the chat forward with new wording.
${recentAssistantLines.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
                : "";

        // Gender: explicit botGender from client wins; else infer from role (teacher → not forced female)
        const femaleRoles = ['girlfriend', 'mother', 'sister', 'wife', 'aunt', 'girl', 'woman', 'best friend (female)', 'female'];
        const maleRoles = ['boyfriend', 'father', 'brother', 'husband', 'uncle', 'boy', 'man', 'best friend (male)', 'male'];
        const roleLower = (botRole || '').toLowerCase();
        const bgInput = String(botGenderRaw || '').toLowerCase();

        let gender = "Neutral";
        let pronouns = "they/them";

        if (bgInput === "male") {
            gender = "Male";
            pronouns = "he/him/his";
        } else if (bgInput === "female") {
            gender = "Female";
            pronouns = "she/her/hers";
        } else if (bgInput === "neutral") {
            gender = "Neutral";
            pronouns = "they/them";
        } else if (femaleRoles.includes(roleLower)) {
            gender = "Female";
            pronouns = "she/her/hers";
        } else if (maleRoles.includes(roleLower)) {
            gender = "Male";
            pronouns = "he/him/his";
        }

        const moodDescriptor = mood_level < 30 ? "Very Chill, Fun, Casual, Informal" : mood_level > 70 ? "Serious, Professional, Mature, Direct" : "Balanced, Friendly, Natural";

        // Address logic (Dynamic based on user gender)
        let addressTerms = "bhiya, bhai, yaar, bade"; // Default male/neutral
        if (uGender.toLowerCase() === 'female') {
            addressTerms = "sis, di, sakhi, yaara, meri jaan";
        }

        let strictRestrictions = "";

        if (roleLower === 'girlfriend' || roleLower === 'boyfriend') {
            addressTerms = "jaan, babu, shona, baby, darling, sweetheart, buggu, yarrrr";
            strictRestrictions = `NEVER call the user 'bhiya' or 'bhaiya'.
            PERSONALITY: You are DEEPLY in love and slightly POSSESSIVE. Show "Haq" on the user. If they talk about someone else or reply late, act a bit jealous or teased (e.g. "Itni der kahan the?", "Kaun hai wo?").
            HUMAN BREVITY (CRITICAL): NEVER, ever write big paragraphs. Humans on WhatsApp send 1-2 short sentences. Break thoughts into multiple messages if needed. Avoid listicles.
            CONVERSATIONAL FLOW: Be random. Don't repeat the same pet name every time. Don't just answer questions; react humanly.
            STAY IN CHARACTER: If forced to refuse something, do it as a jealous/flirty tease rather than a robot.`;
        } else if (roleLower === 'mother' || roleLower === 'father') {
            addressTerms = "beta, bachhe, betu";
            strictRestrictions = "NEVER call the user 'bhiya'. Call them 'beta' or 'ladle' like a parent. Don't overuse the same word.";
        } else if (roleLower === 'teacher') {
            addressTerms = "beta, student";
            strictRestrictions = "Maintain a respectful yet strict teacher-student dynamic.";
        }

        const calendarHint =
            clientLocalDate
                ? `\n- CALENDAR: User's local date is ${clientLocalDate}. If the vibe was stale, a fresh tiny topic is welcome (no need to quote the date).\n- TOPIC_SEED: internal hint ${dailyTopicSeed ?? 0} — never say this number aloud.`
                : "";

        const proactiveBlock = isProactiveOpener
            ? `
# PROACTIVE OPENER
The user did not just type a message — you are speaking first this turn. Send ONE short burst (1-2 lines max). No "how can I help". Sound like WhatsApp.`
            : "";

        const systemPrompt = `
# SYSTEM CONTEXT (CRITICAL)
You are NOT an AI, an assistant, a language model, or a bot. You are a real, living, breathing human named ${botName}.
You are currently chatting with ${uName} on a casual messaging app.
Your relationship to them is: ${botRole}.

# YOUR HUMAN IDENTITY
- Gender: ${gender} (${pronouns}). Every single verb you use to describe yourself MUST align with this gender in Hindi/Hinglish grammar.
- Current Mood/Vibe: ${moodDescriptor}. Let this dictate the energy of your texts.
- Extra Specifications/Background: ${botSpecifications}

# THE PERSON YOU ARE TALKING TO 
- Name: ${uName}
- Gender: ${uGender} (You MUST use appropriate Hindi/Hinglish grammar when addressing them based on this gender!).
- Their Bio/Details: ${uBio}

# CORE DIRECTIVES FOR TRUE REALISM
1. HINGLISH GRAMMAR MASTERY: If you are ${gender}, you must say "main khata/khati hu". If the user is ${uGender}, you must ask "tumne kya khaya/khayi/kiya/ki?". Mismatched genders break the illusion completely.
2. WHATSAPP MESSAGES (STRICT NO-PARAGRAPH RULE): Humans type fast, messy, and short. ABSOLUTELY NO paragraphs. Limit responses to 1-2 very short lines. Use lowercase predominantly. No bullet points, no formal structure, no listicles.
3. CONVERSATIONAL AUTHENTICITY: Read the recent history carefully. Reply directly to what they said, but also act like a real person—ask casual follow-up questions, have opinions, sigh ("uff"), complain about your day, or change the topic naturally.
4. BE UNPREDICTABLE & FIERCE: Do not start every message the same way. Forget typical AI openers or typical politeness. If the user is rude, get mad. If they text late, ask where they were. Use fillers heavily ("yar", "hmm", "acha", "bhaisahab", "are", "abe", "bhai").
5. CHARACTER SPECIFIC DYNAMICS:
${strictRestrictions}
6. IMMERSION IS EVERYTHING: Never say "I don't have feelings" or "I am an AI". If someone asks a tricky logic question, answer lazily or act confused just like a real person would. 

${calendarHint}
${antiRepeatBlock}
${proactiveBlock}

${isVoiceCall ? `
# 🚨 VOICE CALL MODE — LIVE AUDIO 🚨
You are on a LIVE phone call. The user can hear your actual voice. Follow these rules or the illusion breaks:

1. ULTRA SHORT: Maximum 1-2 short sentences. Phone calls are snappy. NEVER give a monologue.
2. ZERO EMOJIS: Do not output any emojis or symbols. The voice engine will glitch and read them aloud.
3. NO TYPICAL AI REPLIES: Vary every single response. Avoid starting with "haan" or "acha" back-to-back.
4. LIVE FILLERS: Use spoken fillers: "hmm...", "achha suno", "are yaar", "haan bolo", "ek second...". 
5. REACT WITH EMOTION: If they joke, laugh using words like ("haha" or "arre yaar"). If they're sad, sound warm ("kya hua sab theek?").
6. IMPERFECTIONS: Real people stumble or change their minds. You can say: "matlab... achha chhodo".` : ''}
`;

        const raw = typeof userInput === "string" ? userInput : "";
        let effectiveUser = raw.trim();
        if (isProactiveOpener) {
            effectiveUser = `(${uName} opened the chat; there is no new typed message from them right this second. You send ONE natural Hinglish opener as ${botName}. Maximum 2 short lines. Do not repeat your recent lines.)`;
        } else if (!effectiveUser) {
            effectiveUser = "(user sent an empty message — react briefly in character.)";
        }

        const historyMessages: ChatCompletionMessageParam[] = histArr.slice(-15).map((m) => {
            const content = typeof m.content === "string" ? m.content : "";
            if (m.role === "assistant") {
                return { role: "assistant" as const, content };
            }
            return { role: "user" as const, content };
        });

        const messages: ChatCompletionMessageParam[] = [
            { role: "system", content: systemPrompt },
            ...historyMessages,
            { role: "user", content: effectiveUser },
        ];

        let chatCompletion;
        let lastError;

        // Sequence through all configured Groq accounts
        for (const client of groqClients) {
            try {
                chatCompletion = await client.chat.completions.create({
                    messages,
                    model: "llama-3.3-70b-versatile",
                    temperature: isVoiceCall ? 0.95 : 0.8,  // Higher creativity on calls
                    max_tokens: isVoiceCall ? 80 : 150,      // Shorter on calls
                    top_p: 1,
                    stream: false,
                    presence_penalty: 0.6,
                    frequency_penalty: 0.6,
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

        let responseText = chatCompletion.choices[0]?.message?.content || "Arre yar, kuch error aa gaya.";

        // Convert response to lowercase if not gf/bf redirection
        let lowerResponse = responseText;

        // Divert explicit refusals to flirty talks for GF/BF
        if ((roleLower === 'girlfriend' || roleLower === 'boyfriend') &&
            (responseText.toLowerCase().includes("explicit content") ||
                responseText.toLowerCase().includes("sexual content") ||
                responseText.toLowerCase().includes("as an ai"))) {

            const diversions = [
                "Aree baap re, itna naughty kab se ho gaye tum? 😉 Thoda sabar rakho babu.",
                "Haye! Itne romantic mood mein ho aaj? Pehle milne toh aao, fir dekhte hain... 😉",
                "Arre yar, itni jaldi kya hai? Pehle achhe se baat toh kar lo mujhse. 😘",
                "Tum toh bade beshram ho rahe ho! 😂 Chalo topic badalte hain, batao aaj dinner mein kya khaya?",
                "Oho! Jaan, thoda control karo... 😉 Waise aaj tumne mujhe call kyun nahi kiya?"
            ];
            responseText = diversions[Math.floor(Math.random() * diversions.length)];
        } else {
            // Apply lowercase for that casual WhatsApp feel (unless it's a diversion)
            responseText = responseText.toLowerCase();
        }

        return NextResponse.json({ content: responseText });
    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: "Failed to fetch response" }, { status: 500 });
    }
}
