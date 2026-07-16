import { createServerFn } from "@tanstack/react-start";

export const generateSpeechFn = createServerFn("POST", async ({ data, voiceId }: { data: string; voiceId: string }) => {
  try {
    const apiKey = process.env.VITE_CARTESIA_API_KEY || process.env.CARTESIA_API_KEY || "sk_car_k1szFDXtEbdrUL2VwUtSdo";
    const response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "Cartesia-Version": "2024-06-10",
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_id: "sonic-3.5",
        transcript: data,
        voice: { mode: "id", id: voiceId },
        output_format: { container: "mp3", bit_rate: 128000, sample_rate: 44100 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cartesia API failed: ${response.statusText} — ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  } catch (err) {
    console.error("Cartesia TTS error:", err);
    throw err;
  }
});
