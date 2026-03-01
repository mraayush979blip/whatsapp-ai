import Groq from "groq-sdk";

// Extract multiple potential keys from the environment
const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];

// Provide a dummy fallback if none exist so the app doesn't crash on boot
if (keys.length === 0) {
    keys.push("dummy_key");
}

// Create an array of Groq instances
export const groqClients = keys.map(apiKey => new Groq({ apiKey }));

// Maintain backward compatibility for single-use imports
export const groq = groqClients[0];
