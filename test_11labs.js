const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
    console.error("Set ELEVENLABS_API_KEY in the environment (e.g. export ELEVENLABS_API_KEY=... or load from .env.local manually).");
    process.exit(1);
}
async function test() {
    try {
        const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
            method: "POST",
            headers: { "xi-api-key": key, "Content-Type": "application/json" },
            body: JSON.stringify({ text: "Hello", model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
        });
        console.log(res.status);
        console.log(await res.text().then((t) => t.substring(0, 100)));
    } catch (e) {
        console.error(e);
    }
}
test();
