import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef, useCallback } from "react";
import { generateSpeechFn } from "./speech-fn";

export const Route = createFileRoute("/vr-classroom")({
  head: () => ({ meta: [{ title: "VR Classroom — The Flow" }] }),
  component: VrClassroomPage,
});

// Skylar — approachable American female voice from Cartesia library
const VOICE_ID = "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4";
const SPHERE_R = 70; // px radius

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
    // Copy buffer so decodeAudioData owns it
    const copy = bytes.buffer.slice(0);
    ctx.decodeAudioData(
      copy,
      (buf) => {
        if (!active) return;
        source = ctx.createBufferSource();
        source.buffer = buf;
        source.connect(ctx.destination);
        source.onended = () => { if (active) onEnded(); };
        source.start(0);
      },
      (e) => { console.error("decode error", e); if (active) onError(); }
    );
  } catch (e) { console.error("playback error", e); if (active) onError(); }
  return () => {
    active = false;
    if (source) { try { source.stop(); } catch (_) {} }
  };
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
          { role: "system", content: `You are a brilliant AI professor teaching ${subject} — topic: "${topic}". Speak in 3–4 vivid, flowing sentences. Progress naturally. Use real-world analogies. No markdown, no lists.` },
          ...history,
          { role: "user", content: "Continue the lecture." },
        ],
        max_tokens: 160, temperature: 0.75,
      }),
    });
    const d = await res.json();
    return d.choices?.[0]?.message?.content?.trim() || "Let us continue exploring this fascinating topic...";
  } catch { return "Let us continue exploring this fascinating topic..."; }
}

async function getImagePrompt(subject: string, topic: string, seg: number): Promise<string> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: `Image generation prompt for ${subject} concept "${topic}" (segment ${seg}). Visual, educational, beautiful. Under 18 words. No quotes.` }],
        max_tokens: 40, temperature: 0.8,
      }),
    });
    const d = await res.json();
    return d.choices?.[0]?.message?.content?.trim() || `${topic} concept`;
  } catch { return `${topic} educational art`; }
}

const buildImageUrl = (p: string) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(p + ", dark background, vibrant colors")}?width=480&height=300&nologo=true`;

// ── SPHERE FLOAT ANIMATION (CSS-based, smooth) ────────────────────────────
// We drive position entirely with CSS transitions + a slow interval
// so the movement is butter-smooth without a RAF loop eating frames.
const WAYPOINTS = [
  { x: 22, y: 30 }, { x: 55, y: 20 }, { x: 78, y: 38 },
  { x: 68, y: 65 }, { x: 38, y: 72 }, { x: 18, y: 55 },
  { x: 45, y: 42 }, { x: 72, y: 25 }, { x: 50, y: 68 },
  { x: 25, y: 40 },
];

function useSmoothFloat(
  active: boolean, W: number, H: number,
  onProject: (idx: number) => void
) {
  const PAD = SPHERE_R + 10;
  const [pos, setPos] = useState({ x: W * 0.5, y: H * 0.5 });
  const [dur, setDur] = useState(3.5); // CSS transition duration in seconds
  const wpIdx = useRef(0);
  const projecting = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const next = useCallback(() => {
    if (!active || W === 0) return;
    const ni = (wpIdx.current + 1) % WAYPOINTS.length;
    wpIdx.current = ni;
    const wp = WAYPOINTS[ni];
    const nx = Math.max(PAD, Math.min(W - PAD, (wp.x / 100) * W));
    const ny = Math.max(PAD, Math.min(H - PAD, (wp.y / 100) * H));
    // Vary speed: fast (1.8s) to slow (5s)
    const speed = 1.8 + Math.random() * 3.2;
    setDur(speed);
    setPos({ x: nx, y: ny });
    if (ni % 3 === 0 && !projecting.current) onProject(ni);
    // Wait for transition to mostly finish, then pick next
    const pause = speed * 1000 + 300 + Math.random() * 800;
    timer.current = setTimeout(next, pause);
  }, [active, W, H, PAD, onProject]);

  useEffect(() => {
    if (!active || W === 0) return;
    // Start immediately at a random waypoint
    const si = Math.floor(Math.random() * WAYPOINTS.length);
    const sw = WAYPOINTS[si];
    setPos({
      x: Math.max(PAD, Math.min(W - PAD, (sw.x / 100) * W)),
      y: Math.max(PAD, Math.min(H - PAD, (sw.y / 100) * H)),
    });
    wpIdx.current = si;
    timer.current = setTimeout(next, 1200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [active, W, H, next, PAD]);

  return { pos, dur };
}

// Bob — separate slow sine wave offset applied via CSS animation
// ── SPHERE COMPONENT ──────────────────────────────────────────────────────
function GhostSphere({ isSpeaking, blink }: { isSpeaking: boolean; blink: boolean }) {
  const D = SPHERE_R * 2;
  const R = SPHERE_R;

  // Eyes: two white rounded rectangles; when blink=true they squish to a line
  const eyeH = blink ? 3 : 20;
  const eyeW = 14;
  const eyeY = R - (blink ? 1.5 : 10); // vertical center stays same
  const eyeLX = R - 20;
  const eyeRX = R + 6;

  return (
    <div
      style={{
        width: D, height: D,
        borderRadius: "50%",
        background: "radial-gradient(circle at 38% 32%, #1a3a6e 0%, #0d1f4a 45%, #060d24 100%)",
        boxShadow: isSpeaking
          ? "0 0 30px 12px rgba(60,120,255,0.55), 0 0 70px 20px rgba(40,90,220,0.28), inset 0 0 30px rgba(80,140,255,0.12)"
          : "0 0 18px 6px rgba(40,90,200,0.35), 0 0 50px 10px rgba(30,70,180,0.15), inset 0 0 20px rgba(60,110,220,0.08)",
        transition: "box-shadow 0.5s ease",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Top specular highlight */}
      <div style={{
        position: "absolute", top: "12%", left: "22%",
        width: "30%", height: "18%",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(180,210,255,0.22) 0%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* SVG for eyes */}
      <svg width={D} height={D} viewBox={`0 0 ${D} ${D}`} style={{ position: "absolute", inset: 0 }}>
        {/* Left eye */}
        <rect
          x={eyeLX} y={eyeY}
          width={eyeW} height={eyeH}
          rx={eyeW / 2}
          fill="white"
          style={{ transition: "height 0.08s ease, y 0.08s ease" }}
        />
        {/* Right eye */}
        <rect
          x={eyeRX} y={eyeY}
          width={eyeW} height={eyeH}
          rx={eyeW / 2}
          fill="white"
          style={{ transition: "height 0.08s ease, y 0.08s ease" }}
        />
        {/* Speaking mouth dots */}
        {isSpeaking && (
          <>
            <circle cx={R - 12} cy={R + 28} r="3" fill="rgba(150,190,255,0.6)">
              <animate attributeName="r" values="2;4;2" dur="0.6s" repeatCount="indefinite" begin="0s"/>
            </circle>
            <circle cx={R} cy={R + 32} r="3" fill="rgba(150,190,255,0.6)">
              <animate attributeName="r" values="2;4;2" dur="0.6s" repeatCount="indefinite" begin="0.1s"/>
            </circle>
            <circle cx={R + 12} cy={R + 28} r="3" fill="rgba(150,190,255,0.6)">
              <animate attributeName="r" values="2;4;2" dur="0.6s" repeatCount="indefinite" begin="0.2s"/>
            </circle>
          </>
        )}
      </svg>
    </div>
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

  // Projected image state
  const [projImage, setProjImage] = useState<string | null>(null);
  const [projLoaded, setProjLoaded] = useState(false);

  const [cSize, setCSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const cleanupAudio = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);
  const sessionOn = useRef(false);
  const segRef = useRef(0);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  const timeLeft = durationMin * 60 - elapsed;
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── BLINK LOOP ────────────────────────────────────────────────────────────
  const scheduleBlink = useCallback(() => {
    const delay = 2500 + Math.random() * 4000;
    blinkTimer.current = setTimeout(() => {
      setBlink(true);
      setTimeout(() => { setBlink(false); scheduleBlink(); }, 120);
    }, delay);
  }, []);

  useEffect(() => {
    if (phase === "session") { scheduleBlink(); }
    return () => { if (blinkTimer.current) clearTimeout(blinkTimer.current); };
  }, [phase, scheduleBlink]);

  // ── CONTAINER SIZE ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "session") return;
    const measure = () => {
      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setCSize({ w: rect.width || window.innerWidth, h: rect.height || window.innerHeight });
      }
    };
    // Measure right away and again after 300ms (after orientation rotation settles)
    measure();
    const t = setTimeout(measure, 300);
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("orientationchange", () => setTimeout(measure, 400));
    return () => { clearTimeout(t); ro.disconnect(); };
  }, [phase]);

  // ── PROJECTION ────────────────────────────────────────────────────────────
  const onProject = useCallback(async (idx: number) => {
    if (!sessionOn.current) return;
    const prompt = await getImagePrompt(selectedSubject?.label || "Science", selectedTopic, idx);
    setProjImage(buildImageUrl(prompt));
    setProjLoaded(false);
    setTimeout(() => { setProjImage(null); }, 12000);
  }, [selectedSubject, selectedTopic]);

  const { pos, dur } = useSmoothFloat(phase === "session", cSize.w, cSize.h, onProject);

  // ── SPEAK ─────────────────────────────────────────────────────────────────
  const speak = useCallback(async (text: string, onDone: () => void) => {
    cleanupAudio.current?.();
    const ctx = audioCtxRef.current;
    if (!ctx) { onDone(); return; }
    try {
      if (ctx.state === "suspended") await ctx.resume();
      console.log("[VR] calling Cartesia TTS, ctx state:", ctx.state);
      const b64 = await generateSpeech({ data: text, voiceId: VOICE_ID });
      console.log("[VR] got audio b64 length:", b64?.length);
      const stop = playBase64Audio(ctx, b64, onDone, () => {
        console.warn("[VR] Cartesia decode failed, falling back to browser TTS");
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 0.88; u.pitch = 1.05;
          u.onend = onDone;
          u.onerror = () => onDone();
          window.speechSynthesis.speak(u);
        } else onDone();
      });
      cleanupAudio.current = stop;
    } catch (e) {
      console.error("[VR] speak error:", e);
      onDone();
    }
  }, [generateSpeech]);

  // ── SEGMENT LOOP ──────────────────────────────────────────────────────────
  const doSegment = useCallback(async () => {
    if (running.current || !sessionOn.current) return;
    running.current = true;
    const text = await getLessonText(
      selectedSubject?.label || "Science", selectedTopic, historyRef.current
    );
    if (!sessionOn.current) { running.current = false; return; }
    setIsSpeaking(true);
    speak(text, () => {
      if (!sessionOn.current) return;
      setIsSpeaking(false);
      historyRef.current = [...historyRef.current.slice(-10), { role: "assistant", content: text }];
      segRef.current++;
      setSegCount(segRef.current);
      running.current = false;
      setTimeout(() => { if (sessionOn.current) doSegment(); }, 1000);
    });
  }, [selectedSubject, selectedTopic, speak]);

  // ── ENTER (must be called directly from tap) ───────────────────────────
  const startSession = useCallback(async () => {
    // Create a fresh AudioContext INSIDE the user gesture — this is mandatory on mobile
    try {
      const AC = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        ?? window.AudioContext;
      const ctx = new AC();
      audioCtxRef.current = ctx;
      // Resume while still inside the gesture callstack
      if (ctx.state !== "running") await ctx.resume();
      console.log("[VR] AudioContext created, state:", ctx.state);
    } catch (e) { console.error("[VR] AudioContext init failed:", e); }

    setElapsed(0);
    segRef.current = 0;
    historyRef.current = [];
    setSegCount(0);
    setIsSpeaking(false);
    setProjImage(null);
    sessionOn.current = true;
    setPhase("loading");
    setTimeout(() => setPhase("session"), 1200);
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "session") return;
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Start first segment once container is measured
  useEffect(() => {
    if (phase === "session" && cSize.w > 0 && segCount === 0 && !running.current) {
      setTimeout(() => doSegment(), 500);
    }
  }, [phase, cSize.w, segCount, doSegment]);

  // Time-out end
  useEffect(() => {
    if (phase === "session" && timeLeft <= 0) {
      sessionOn.current = false; cleanupAudio.current?.(); setPhase("setup");
    }
  }, [phase, timeLeft]);

  // Cleanup on unmount
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
    <div className="fixed inset-0 bg-[#050508] text-white flex flex-col overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-48 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(60,120,255,0.15) 0%, transparent 70%)" }} />
      <header className="relative flex items-center px-5 pt-12 pb-5 flex-shrink-0">
        <button onClick={() => navigate({ to: "/more" })}
          className="h-9 w-9 rounded-full bg-white/[0.06] flex items-center justify-center mr-4 hover:bg-white/10 active:scale-95 transition-all">
          <svg className="h-4 w-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">VR Classroom</h1>
          <p className="text-xs text-white/30 mt-0.5">Floating AI · Live voice · Real-time images</p>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/20 rounded-full px-3 py-1.5">
          <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">AI Live</span>
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
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
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
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-4">Duration</p>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map(d => (
                <button key={d} onClick={() => setDurationMin(d)}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all active:scale-95 ${durationMin === d ? "bg-white text-black" : "bg-white/[0.05] text-white/50 hover:bg-white/10 hover:text-white"}`}>
                  {d}m
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/20 mt-2.5 text-center">Minimum 20 min · Landscape fullscreen</p>
          </div>
        )}

        {selectedSubject && selectedTopic && (
          <button onClick={startSession}
            className={`w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] bg-gradient-to-r ${selectedSubject.color}`}
            style={{ boxShadow: "0 8px 32px rgba(60,120,255,0.3)" }}>
            Enter VR Classroom · {durationMin} min
          </button>
        )}
      </div>
    </div>
  );

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-10">
      <GhostSphere isSpeaking={true} blink={false} />
      <div className="flex items-center gap-2">
        {[0,1,2].map(i => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );

  // ── SESSION ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @media screen and (orientation: portrait) {
          #vr-root {
            position: fixed;
            top: 0;
            left: 100vw;
            width: 100vh !important;
            height: 100vw !important;
            transform: rotate(90deg);
            transform-origin: top left;
            overflow: hidden;
          }
        }
        @media screen and (orientation: landscape) {
          #vr-root { position: fixed; inset: 0; width: 100vw; height: 100dvh; }
        }
        @keyframes bobFloat {
          0%,100% { transform: translate(-50%,-50%) translateY(0px); }
          50%      { transform: translate(-50%,-50%) translateY(-10px); }
        }
        @keyframes imgIn { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }
      `}</style>

      <div id="vr-root" className="bg-black overflow-hidden" ref={containerRef}>

        {/* Sphere + projection */}
        {cSize.w > 0 && (
          <div style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            // CSS transition for smooth movement — duration comes from useSmoothFloat
            transition: `left ${dur}s cubic-bezier(0.45,0.05,0.55,0.95), top ${dur}s cubic-bezier(0.45,0.05,0.55,0.95)`,
            willChange: "left, top",
            zIndex: 20,
            pointerEvents: "none",
          }}>
            {/* Bob animation wrapper */}
            <div style={{ animation: "bobFloat 3.2s ease-in-out infinite", display: "inline-block" }}>
              <GhostSphere isSpeaking={isSpeaking} blink={blink} />
            </div>

            {/* Projected image */}
            {projImage && (
              <div style={{
                position: "absolute",
                left: SPHERE_R * 2 + 20,
                top: -SPHERE_R * 0.6,
                width: 200,
                animation: "imgIn 0.5s ease forwards",
                zIndex: 10,
              }}>
                <div style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1.5px solid rgba(100,160,255,0.3)",
                  boxShadow: "0 0 30px rgba(60,120,255,0.4)",
                  background: "#05091a",
                }}>
                  {!projLoaded && (
                    <div className="flex items-center justify-center h-24">
                      <div className="h-5 w-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                    </div>
                  )}
                  <img src={projImage} alt="" style={{ width: "100%", maxHeight: 130, objectFit: "cover", display: projLoaded ? "block" : "none" }}
                    onLoad={() => setProjLoaded(true)} onError={() => setProjLoaded(true)} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Exit */}
        <button onClick={end} className="absolute bottom-5 right-5 z-50 h-9 w-9 rounded-full flex items-center justify-center active:scale-90 transition-all"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <svg className="h-4 w-4 text-white/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Timer */}
        <div className="absolute bottom-5 left-5 z-50 font-mono text-[10px] tabular-nums select-none"
          style={{ color: timeLeft < 300 ? "rgba(239,68,68,0.45)" : "rgba(255,255,255,0.15)" }}>
          {fmt(Math.max(0, timeLeft))}
        </div>
      </div>
    </>
  );
}
