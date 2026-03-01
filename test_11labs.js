const key = 'sk_cde3ff70a06fdd0e3f22835ca69867c19704c8bf3634f797';
async function test() {
    try {
        const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
            method: 'POST',
            headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'Hello', model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
        });
        console.log(res.status);
        console.log(await res.text().then(t => t.substring(0, 100)));
    } catch (e) {
        console.error(e);
    }
}
test();
