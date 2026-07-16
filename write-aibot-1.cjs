const fs = require("fs");
const out = "src/routes/ai-bot.tsx";

const part1 = `import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef, useCallback } from "react";
import { generateSpeechFn } from "./speech-fn";

export const Route = createFileRoute("/ai-bot")({
  head: () => ({ meta: [{ title: "AI Bot — The Flow" }] }),
  component: AiBotPage,
});

const VOICE_ID = "ef191366-f52f-447a-a398-ed8c0f2943a1";

const TOPICS = [
  { label: "Space & Cosmos",     prompt: "outer space galaxy nebula stars planets" },
  { label: "Ocean Life",         prompt: "deep ocean bioluminescent sea creatures" },
  { label: "Ancient Worlds",     prompt: "ancient egypt rome greece pyramids temples" },
  { label: "Mathematics",        prompt: "mathematical fractals geometry sacred geometry" },
  { label: "Human Body",         prompt: "human anatomy cells DNA brain neuroscience" },
  { label: "Earth & Climate",    prompt: "earth ecosystems weather volcano lightning" },
  { label: "Future Tech",        prompt: "futuristic AI robots circuits holographic" },
  { label: "Art & Culture",      prompt: "world art movements paintings cultural art" },
];

async function getExplanation(topic: string, ctx: string, imgDesc: string): Promise<{text:string;shouldGenerateImage:boolean;imagePrompt:string}> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: \`Bearer \${import.meta.env.VITE_GROQ_API_KEY}\` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: \`You are an excited AI robot flying around a dark screen, teaching about "\${topic}". Speak in 2-3 vivid energetic sentences. \${imgDesc ? "You just showed an image of: "+imgDesc+". Reference it." : ""} Also decide: should you generate a new image now? Only true every 3rd message. If true give a short visual image prompt (max 12 words). Respond ONLY as JSON: {"text":"...","shouldGenerateImage":boolean,"imagePrompt":"..."}\` },
          ...(ctx ? [{ role: "assistant", content: ctx }] : []),
          { role: "user", content: "Continue!" },
        ],
        max_tokens: 220, temperature: 0.85,
      }),
    });
    const data = await res.json();
    const raw = (data.choices?.[0]?.message?.content || "{}").trim();
    const m = raw.match(/\\{[\\s\\S]*\\}/);
    return m ? JSON.parse(m[0]) : { text: "Fascinating! Let me show you something incredible...", shouldGenerateImage: false, imagePrompt: "" };
  } catch { return { text: "This is absolutely remarkable!", shouldGenerateImage: false, imagePrompt: "" }; }
}

function imgUrl(prompt: string, topicPrompt: string): string {
  const p = encodeURIComponent(prompt + ", " + topicPrompt + ", vibrant digital art, educational");
  return \`https://image.pollinations.ai/prompt/\${p}?width=480&height=300&nologo=true&seed=\${Math.floor(Math.random()*9999)}\`;
}

function playAudio(ctx: AudioContext, b64: string, onEnd: ()=>void, onErr: ()=>void): {cleanup:()=>void} {
  let src: AudioBufferSourceNode|null = null; let alive = true;
  try {
    const bytes = Uint8Array.from(atob(b64), c=>c.charCodeAt(0));
    ctx.decodeAudioData(bytes.buffer.slice(0), buf => {
      if (!alive) return;
      src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination);
      src.onended = () => { if (alive) onEnd(); }; src.start(0);
    }, () => { if (alive) onErr(); });
  } catch { if (alive) onErr(); }
  return { cleanup: () => { alive=false; try { src?.stop(); } catch {} } };
}
`;

fs.writeFileSync(out, part1, "utf8");
console.log("part1 ok");
