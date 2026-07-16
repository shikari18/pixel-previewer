import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef, useCallback } from "react";
import { generateSpeechFn } from "./speech-fn";

export const Route = createFileRoute("/vr-classroom")({
  head: () => ({ meta: [{ title: "VR Classroom — The Flow" }] }),
  component: VrClassroomPage,
});

// Skylar — Cartesia female voice
const VOICE_ID = "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4";
const R = 55; // sphere radius in px
const D = R * 2; // diameter

// ── AUDIO ────────────────────────────────────────────────────────────────
function playBase64Audio(
  ctx: AudioContext,
  base64: string,
  onEnded: () => void,
  onError: () => void
): () => void {
  let source: AudioBufferSourceNode | null = null;
  let active = true;
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    ctx.decodeAudioData(
      bytes.buffer.slice(0),
      (buf) => {
        if (!active) return;
        source = ctx.createBufferSource();
        source.buffer = buf;
        source.connect(ctx.destination);
        source.onended = () => { if (active) onEnded(); };
        source.start(0);
      },
      () => { if (active) onError(); }
    );
  } catch { if (active) onError(); }
  return () => {
    active = false;
    if (source) { try { source.stop(); } catch (_) {} }
  };
}

// Browser TTS fallback
function speakBrowser(text: string, onDone: () => void) {
  if (!window.speechSynthesis) { onDone(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.05; u.pitch = 1.1; u.volume = 1;
  // Pick a female voice if available
  const voices = window.speechSynthesis.getVoices();
  const female = voices.find(v => /female|woman|girl|zira|samantha|karen|moira|tessa|fiona/i.test(v.name));
  if (female) u.voice = female;
  u.onend = onDone;
  u.onerror = () => onDone();
  window.speechSynthesis.speak(u);
}

// ── SUBJECTS ─────────────────────────────────────────────────────────────
const SUBJECTS = [
  { id: "math",        label: "Mathematics",  icon: "∑",   color: "from-indigo-500 to-violet-600",  topics: ["Calculus", "Algebra", "Statistics", "Geometry", "Number Theory"] },
  { id: "physics",     label: "Physics",       icon: "⚛",   color: "from-cyan-500 to-blue-600",      topics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Quantum Physics", "Optics"] },
  { id: "chemistry",   label: "Chemistry",     icon: "⚗",   color: "from-emerald-500 to-teal-600",   topics: ["Organic Chemistry", "Inorganic", "Physical Chemistry", "Biochemistry", "Analytical"] },
  { id: "biology",     label: "Biology",       icon: "🧬",  color: "from-green-500 to-emerald-600",  topics: ["Cell Biology", "Genetics", "Ecology", "Human Anatomy", "Evolution"] },
  { id: "history",     label: "History",       icon: "📜",  color: "from-amber-500 to-orange-600",   topics: ["Ancient History", "World Wars", "African History", "Colonial Era", "Modern History"] },
  { id: "programming", label: "Programming",   icon: "</>", color: "from-rose-500 to-pink-600",      topics: ["Python", "JavaScript", "Algorithms", "Data Structures", "System Design"] },
  { id: "economics",   label: "Economics",     icon: "📈",  color: "from-yellow-500 to-amber-600",   topics: ["Microeconomics", "Macroeconomics", "Finance", "Game Theory", "Development"] },
  { id: "literature",  label: "Literature",    icon: "📚",  color: "from-purple-500 to-fuchsia-600", topics: ["Poetry", "Fiction", "Drama", "Essay Writing", "Literary Analysis"] },
];
const DURATION_OPTIONS = [20, 30, 45, 60, 90];

// ── AI ────────────────────────────────────────────────────────────────────
async function getLessonText(
  subject: string, topic: string,
  history: { role: string; content: string }[]
): Promise<string> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are Zuri, a super cheerful, bubbly, energetic AI teacher teaching ${subject} about "${topic}". You love learning and get genuinely excited about ideas! Speak in 2–3 short, lively, upbeat sentences. Use exclamations, fun comparisons, real-world analogies. Sound warm, encouraging, and playful — like the most fun teacher ever. No markdown, no lists.`,
          },
          ...history,
          { role: "user", content: "Teach me the next part!" },
        ],
        max_tokens: 130, temperature: 0.85,
      }),
    });
    const d = await res.json();
    return d.choices?.[0]?.message?.content?.trim() || "Oh this is SO fascinating — let's keep going!";
  } catch { return "Oh this is SO fascinating — let's keep going!"; }
}

// Generate image prompt AND preload image, return url when loaded
async function prepareImage(subject: string, topic: string, seg: number): Promise<string> {
  let prompt = `${topic} educational diagram`;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: `Short Stable Diffusion prompt for a ${subject} visual about "${topic}" segment ${seg}. Max 12 words. No quotes.` }],
        max_tokens: 30, temperature: 0.7,
      }),
    });
    const d = await res.json();
    prompt = d.choices?.[0]?.message?.content?.trim() || prompt;
  } catch { /* keep default */ }

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ", vibrant, dark background, 4k")}?width=480&height=300&nologo=true&seed=${seg}`;

  // Preload: fetch as blob so it's cached before we show it
  try {
    await fetch(url, { mode: "no-cors" });
  } catch { /* ignore, img tag will try anyway */ }

  return url;
}

// ── WAYPOINTS — stays well inside bounds ─────────────────────────────────
// Positions are % of container. Bot size = D px, so PAD = D/2 from edge.
const WPS = [
  { x: 25, y: 30 }, { x: 60, y: 22 }, { x: 78, y: 45 },
  { x: 65, y: 68 }, { x: 35, y: 72 }, { x: 18, y: 52 },
  { x: 48, y: 38 }, { x: 74, y: 28 }, { x: 52, y: 65 },
  { x: 22, y: 42 },
];

// ── FLOAT HOOK ────────────────────────────────────────────────────────────
function useFloat(active: boolean, W: number, H: number) {
  const PAD = R + 4; // keep sphere fully inside
  const [pos, setPos] = useState({ x: W * 0.5 - R, y: H * 0.5 - R });
  const [moveDur, setMoveDur] = useState("1.2s");
  const wpIdx = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goNext = useCallback(() => {
    if (!active || W === 0) return;
    const ni = (wpIdx.current + 1) % WPS.length;
    wpIdx.current = ni;
    const wp = WPS[ni];
    // top-left corner of the sphere div
    const nx = Math.max(PAD, Math.min(W - PAD - D, (wp.x / 100) * W));
    const ny = Math.max(PAD, Math.min(H - PAD - D, (wp.y / 100) * H));

    // random speed: 0.5s (fast dash) to 1.4s (gentle glide)
    const speed = 0.5 + Math.random() * 0.9;
    setMoveDur(`${speed.toFixed(2)}s`);
    setPos({ x: nx, y: ny });

    // stop at waypoint for 0.6–2.5s then move again
    const stop = 600 + Math.random() * 1900;
    timer.current = setTimeout(goNext, speed * 1000 + stop);
  }, [active, W, H, PAD]);

  useEffect(() => {
    if (!active || W === 0) return;
    // Start at a safe initial position
    setPos({ x: Math.max(PAD, W * 0.5 - R), y: Math.max(PAD, H * 0.5 - R) });
    timer.current = setTimeout(goNext, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [active, W, H, goNext, PAD]);

  return { pos, moveDur };
}

// ── SPHERE SVG — dark matte, two blinking white eyes ──────────────────────
function Sphere({ isSpeaking, blink }: { isSpeaking: boolean; blink: boolean }) {
  const eyeH = blink ? 2 : 16;
  const eyeRx = 5;
  // Eye centers at 40% and 60% of diameter horizontally, 48% vertically
  const eyeLx = D * 0.33;
  const eyeRx2 = D * 0.57;
  const eyeY = D * 0.46;

  return (
    <svg
      width={D} height={D}
      viewBox={`0 0 ${D} ${D}`}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        {/* Dark matte sphere — very dark charcoal, no glow */}
        <radialGradient id="sg" cx="38%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#2a2a2a"/>
          <stop offset="55%" stopColor="#181818"/>
          <stop offset="100%" stopColor="#0a0a0a"/>
        </radialGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx={R} cy={D - 4} rx={R * 0.6} ry={5} fill="rgba(0,0,0,0.4)"/>

      {/* Main sphere — dark matte, no box-shadow */}
      <circle cx={R} cy={R} r={R - 1} fill="url(#sg)"/>

      {/* Subtle specular top-left */}
      <ellipse cx={R * 0.62} cy={R * 0.52} rx={R * 0.18} ry={R * 0.12}
        fill="rgba(255,255,255,0.07)"/>

      {/* LEFT EYE */}
      <rect
        x={eyeLx - eyeRx}
        y={eyeY - eyeH / 2}
        width={eyeRx * 2}
        height={eyeH}
        rx={eyeRx}
        fill="white"
      />
      {/* RIGHT EYE */}
      <rect
        x={eyeRx2 - eyeRx}
        y={eyeY - eyeH / 2}
        width={eyeRx * 2}
        height={eyeH}
        rx={eyeRx}
        fill="white"
      />

      {/* Subtle mouth bounce when speaking */}
      {isSpeaking && (
        <>
          <circle cx={R - 8} cy={R + R * 0.4} r="2.5" fill="rgba(255,255,255,0.35)">
            <animate attributeName="cy" values={`${R + R * 0.38};${R + R * 0.44};${R + R * 0.38}`} dur="0.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx={R} cy={R + R * 0.44} r="2.5" fill="rgba(255,255,255,0.35)">
            <animate attributeName="cy" values={`${R + R * 0.44};${R + R * 0.38};${R + R * 0.44}`} dur="0.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx={R + 8} cy={R + R * 0.4} r="2.5" fill="rgba(255,255,255,0.35)">
            <animate attributeName="cy" values={`${R + R * 0.38};${R + R * 0.44};${R + R * 0.38}`} dur="0.5s" repeatCount="indefinite" begin="0.1s"/>
          </circle>
        </>
      )}
    </svg>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
function VrClassroomPage() {
  const navigate = useNavigate();
  const generateSpeech = useServerFn(generateSpeechFn);

  const [phase, setPhase] = useState<"setup" | "loading" | "session">("setup");
  const [selectedSubject, setSelectedSubject] = useState<(typeof SUBJECTS)[0] | null>(null);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [elapsed, setElapsed] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [segCount, setSegCount] = useState(0);
  const [blink, setBlink] = useState(false);
  const [projImage, setProjImage] = useState<string | null>(null);
  const [projVisible, setProjVisible] = useState(false);

  const [cW, setCW] = useState(0);
  const [cH, setCH] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const cleanupAudio = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);
  const sessionOn = useRef(false);
  const segRef = useRef(0);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const nextImageUrl = useRef<string | null>(null); // pre-loaded

  const timeLeft = durationMin * 60 - elapsed;
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── BLINK ─────────────────────────────────────────────────────────────────
  const doBlink = useCallback(() => {
    setBlink(true);
    setTimeout(() => {
      setBlink(false);
      blinkTimer.current = setTimeout(doBlink, 2000 + Math.random() * 4000);
    }, 110);
  }, []);

  useEffect(() => {
    if (phase !== "session") return;
    blinkTimer.current = setTimeout(doBlink, 1000);
    return () => { if (blinkTimer.current) clearTimeout(blinkTimer.current); };
  }, [phase, doBlink]);

  // ── CONTAINER SIZE ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "session") return;
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      // Use window dimensions as fallback — more reliable on mobile
      setCW(el.offsetWidth || window.innerWidth);
      setCH(el.offsetHeight || window.innerHeight);
    };
    measure();
    setTimeout(measure, 200);
    setTimeout(measure, 600);
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [phase]);

  const { pos, moveDur } = useFloat(phase === "session" && cW > 0, cW, cH);

  // ── SPEAK ─────────────────────────────────────────────────────────────────
  const speak = useCallback(async (text: string, onDone: () => void) => {
    cleanupAudio.current?.();
    const ctx = audioCtxRef.current;

    // Try Cartesia first if ctx is available
    if (ctx) {
      try {
        if (ctx.state === "suspended") await ctx.resume();
        const b64 = await generateSpeech({ data: text, voiceId: VOICE_ID });
        if (b64 && b64.length > 100) {
          const stop = playBase64Audio(ctx, b64, onDone, () => speakBrowser(text, onDone));
          cleanupAudio.current = stop;
          return;
        }
      } catch (e) {
        console.warn("[VR] Cartesia failed, using browser TTS", e);
      }
    }

    // Always-available fallback
    speakBrowser(text, onDone);
  }, [generateSpeech]);

  // ── SEGMENT LOOP ──────────────────────────────────────────────────────────
  const doSegment = useCallback(async () => {
    if (running.current || !sessionOn.current) return;
    running.current = true;

    const subj = selectedSubject?.label || "Science";

    // Pre-fetch the NEXT image in background while speaking current segment
    const imagePromise = prepareImage(subj, selectedTopic, segRef.current + 1);

    // Show the already-preloaded image from previous cycle (if any)
    if (nextImageUrl.current) {
      setProjImage(nextImageUrl.current);
      setProjVisible(true);
      setTimeout(() => setProjVisible(false), 10000);
    }

    const text = await getLessonText(subj, selectedTopic, historyRef.current);
    if (!sessionOn.current) { running.current = false; return; }

    setIsSpeaking(true);
    speak(text, async () => {
      if (!sessionOn.current) return;
      setIsSpeaking(false);
      historyRef.current = [...historyRef.current.slice(-10), { role: "assistant", content: text }];
      segRef.current++;
      setSegCount(segRef.current);
      running.current = false;

      // Store the image that was pre-loaded during speech — show on next segment
      nextImageUrl.current = await imagePromise;

      setTimeout(() => { if (sessionOn.current) doSegment(); }, 800);
    });
  }, [selectedSubject, selectedTopic, speak]);

  // ── ENTER ─────────────────────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    // Create + unlock AudioContext INSIDE the user gesture
    try {
      const AC = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        ?? window.AudioContext;
      const ctx = new AC();
      // Must call resume() synchronously from the gesture — before any await
      const resumePromise = ctx.resume();
      audioCtxRef.current = ctx;
      await resumePromise;
    } catch (e) { console.warn("[VR] AudioContext error:", e); }

    setElapsed(0);
    segRef.current = 0;
    historyRef.current = [];
    nextImageUrl.current = null;
    setSegCount(0);
    setIsSpeaking(false);
    setProjImage(null);
    setProjVisible(false);
    sessionOn.current = true;
    setPhase("loading");
    setTimeout(() => setPhase("session"), 1000);
  }, []);

  useEffect(() => {
    if (phase !== "session") return;
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    if (phase === "session" && cW > 0 && segCount === 0 && !running.current) {
      // Preload first image before we start talking
      prepareImage(selectedSubject?.label || "Science", selectedTopic, 0).then(url => {
        nextImageUrl.current = url;
      });
      setTimeout(() => doSegment(), 400);
    }
  }, [phase, cW, segCount, doSegment, selectedSubject, selectedTopic]);

  useEffect(() => {
    if (phase === "session" && timeLeft <= 0) {
      sessionOn.current = false; cleanupAudio.current?.(); setPhase("setup");
    }
  }, [phase, timeLeft]);

  useEffect(() => () => {
    sessionOn.current = false;
    cleanupAudio.current?.();
    if (timerRef.current) clearInterval(timerRef.current);
    if (blinkTimer.current) clearTimeout(blinkTimer.current);
    window.speechSynthesis?.cancel();
  }, []);

  const end = useCallback(() => {
    sessionOn.current = false;
    cleanupAudio.current?.();
    window.speechSynthesis?.cancel();
    setPhase("setup");
  }, []);

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="fixed inset-0 bg-[#060609] text-white flex flex-col overflow-hidden">
      <header className="flex items-center px-5 pt-12 pb-5 flex-shrink-0">
        <button onClick={() => navigate({ to: "/more" })}
          className="h-9 w-9 rounded-full bg-white/[0.06] flex items-center justify-center mr-4 hover:bg-white/10 active:scale-95 transition-all">
          <svg className="h-4 w-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">VR Classroom</h1>
          <p className="text-xs text-white/30 mt-0.5">Live AI · Voice · Images</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-4">Subject</p>
        <div className="grid grid-cols-2 gap-2.5 mb-8">
          {SUBJECTS.map(subj => (
            <button key={subj.id} onClick={() => { setSelectedSubject(subj); setSelectedTopic(""); }}
              className={`rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.97] border ${selectedSubject?.id === subj.id ? `bg-gradient-to-br ${subj.color} border-white/20` : "bg-white/[0.04] border-white/[0.05] hover:bg-white/[0.07]"}`}>
              <div className="text-2xl mb-2 leading-none">{subj.icon}</div>
              <div className="text-sm font-semibold leading-tight">{subj.label}</div>
            </button>
          ))}
        </div>

        {selectedSubject && (
          <div className="mb-8 animate-in fade-in duration-300">
            <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-4">Topic</p>
            <div className="flex flex-wrap gap-2">
              {selectedSubject.topics.map(topic => (
                <button key={topic} onClick={() => setSelectedTopic(topic)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95 ${selectedTopic === topic ? `bg-gradient-to-r ${selectedSubject.color} text-white` : "bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"}`}>
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTopic && (
          <div className="mb-8 animate-in fade-in duration-300">
            <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-4">Duration</p>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map(d => (
                <button key={d} onClick={() => setDurationMin(d)}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all active:scale-95 ${durationMin === d ? "bg-white text-black" : "bg-white/[0.05] text-white/50 hover:bg-white/10 hover:text-white"}`}>
                  {d}m
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/18 mt-2.5 text-center">Min 20 min · Landscape fullscreen</p>
          </div>
        )}

        {selectedSubject && selectedTopic && (
          <button onClick={startSession}
            className={`w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] bg-gradient-to-r ${selectedSubject.color}`}>
            Enter VR Classroom · {durationMin} min
          </button>
        )}
      </div>
    </div>
  );

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <Sphere isSpeaking={false} blink={false}/>
    </div>
  );

  // ── SESSION ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @media screen and (orientation: portrait) {
          #vr-root {
            position: fixed !important;
            top: 0 !important;
            left: 100vw !important;
            width: 100vh !important;
            height: 100vw !important;
            transform: rotate(90deg) !important;
            transform-origin: top left !important;
            overflow: hidden !important;
          }
        }
        @media screen and (orientation: landscape) {
          #vr-root {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100dvh !important;
          }
        }
        @keyframes bob {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes imgPop {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div id="vr-root" style={{ background: "#000" }} ref={containerRef}>

        {/* Bot + image */}
        {cW > 0 && (
          <div style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            width: D,
            height: D,
            transition: `left ${moveDur} cubic-bezier(0.4,0,0.2,1), top ${moveDur} cubic-bezier(0.4,0,0.2,1)`,
            willChange: "left, top",
            zIndex: 20,
            pointerEvents: "none",
          }}>
            {/* Bob wrapper */}
            <div style={{ animation: "bob 2.8s ease-in-out infinite" }}>
              <Sphere isSpeaking={isSpeaking} blink={blink}/>
            </div>

            {/* Pre-loaded image shown during speech */}
            {projVisible && projImage && (
              <div style={{
                position: "absolute",
                left: D + 14,
                top: -10,
                width: 180,
                animation: "imgPop 0.4s ease forwards",
                zIndex: 10,
              }}>
                <img
                  src={projImage}
                  alt=""
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "block",
                    background: "#111",
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Exit */}
        <button onClick={end}
          style={{ position: "absolute", bottom: 16, right: 16, zIndex: 50, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.35)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        {/* Timer */}
        <div style={{ position: "absolute", bottom: 18, left: 16, zIndex: 50, fontFamily: "monospace", fontSize: 10, color: timeLeft < 300 ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.18)", userSelect: "none" }}>
          {fmt(Math.max(0, timeLeft))}
        </div>
      </div>
    </>
  );
}
