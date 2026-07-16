import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef, useCallback } from "react";
import { generateSpeechFn } from "./speech-fn";

export const Route = createFileRoute("/vr-classroom")({
  head: () => ({ meta: [{ title: "VR Classroom — The Flow" }] }),
  component: VrClassroomPage,
});

const PROFESSOR_VOICE_ID = "ef191366-f52f-447a-a398-ed8c0f2943a1";

// ── AUDIO PLAYBACK ────────────────────────────────────────────────────────
function playBase64Audio(
  ctx: AudioContext,
  base64: string,
  onEnded: () => void,
  onError: () => void
): { cleanup: () => void } {
  let source: AudioBufferSourceNode | null = null;
  let active = true;
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    ctx.decodeAudioData(
      bytes.buffer,
      (audioBuffer) => {
        if (!active) return;
        source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => { if (active) onEnded(); };
        source.start(0);
      },
      () => { if (active) onError(); }
    );
  } catch { if (active) onError(); }
  return {
    cleanup: () => {
      active = false;
      if (source) { try { source.stop(); } catch (_e) {} }
    },
  };
}

// ── SUBJECTS ──────────────────────────────────────────────────────────────
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

// ── AI CALLS ─────────────────────────────────────────────────────────────
async function getLessonText(
  subject: string,
  topic: string,
  history: { role: string; content: string }[]
): Promise<string> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a brilliant AI professor teaching ${subject} on "${topic}". Keep each segment to 3–4 vivid sentences. Progress the lecture. Use real-world analogies. No markdown, no bullets, no lists.`,
          },
          ...history,
          { role: "user", content: "Continue the lecture." },
        ],
        max_tokens: 160,
        temperature: 0.75,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "Let us continue exploring this fascinating topic...";
  } catch {
    return "Let us continue exploring this fascinating topic...";
  }
}

async function getImagePrompt(subject: string, topic: string, seg: number): Promise<string> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Create a vivid image prompt for a ${subject} concept about "${topic}" (segment ${seg}). Visual, educational, beautiful. Under 20 words. No quotes.`,
          },
        ],
        max_tokens: 40,
        temperature: 0.8,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || `${topic} educational diagram`;
  } catch {
    return `${topic} educational concept art`;
  }
}

function buildImageUrl(prompt: string): string {
  const encoded = encodeURIComponent(prompt + ", educational, detailed, vibrant, dark background");
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=320&nologo=true&enhance=true`;
}

// ── ROBOT WAYPOINTS ───────────────────────────────────────────────────────
const WAYPOINTS = [
  { x: 15, y: 25, speedFactor: 1.0 },
  { x: 50, y: 15, speedFactor: 1.8 },
  { x: 78, y: 30, speedFactor: 0.5 },
  { x: 65, y: 60, speedFactor: 1.4 },
  { x: 30, y: 70, speedFactor: 0.7 },
  { x: 12, y: 50, speedFactor: 1.6 },
  { x: 40, y: 40, speedFactor: 0.4 },
  { x: 72, y: 20, speedFactor: 2.0 },
  { x: 55, y: 75, speedFactor: 0.9 },
  { x: 20, y: 35, speedFactor: 1.2 },
];

const ROBOT_SIZE = 120; // px

interface RobotState {
  x: number; y: number;
  targetX: number; targetY: number;
  waypointIdx: number;
  speed: number;
  bobOffset: number;
  projecting: boolean;
  imageUrl: string | null;
  imageLoaded: boolean;
  facing: "left" | "right";
}

function useRobotAnimation(
  active: boolean,
  containerW: number,
  containerH: number,
  onProjectionCycle: (idx: number) => void
) {
  const stateRef = useRef<RobotState>({
    x: containerW * 0.5, y: containerH * 0.45,
    targetX: containerW * 0.5, targetY: containerH * 0.45,
    waypointIdx: 0, speed: 1.8, bobOffset: 0,
    projecting: false, imageUrl: null, imageLoaded: false, facing: "right",
  });

  const [robotPos, setRobotPos] = useState({
    x: containerW * 0.5, y: containerH * 0.45,
    facing: "right" as "left" | "right",
    bobOffset: 0, projecting: false,
    imageUrl: null as string | null, imageLoaded: false,
  });

  const rafRef = useRef<number | null>(null);
  const projTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef(0);

  const advance = useCallback(() => {
    if (!active) return;
    const s = stateRef.current;
    const half = ROBOT_SIZE / 2;
    frameRef.current += 1;
    s.bobOffset = Math.sin(frameRef.current * 0.038) * 7;

    const dx = s.targetX - s.x;
    const dy = s.targetY - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 2) {
      const move = Math.min(dist, s.speed);
      s.x += (dx / dist) * move;
      s.y += (dy / dist) * move;
      if (dx !== 0) s.facing = dx > 0 ? "right" : "left";
    } else if (!arrivalTimerRef.current) {
      const pause = 300 + Math.random() * 1400;
      arrivalTimerRef.current = setTimeout(() => {
        arrivalTimerRef.current = null;
        const nextIdx = (s.waypointIdx + 1) % WAYPOINTS.length;
        const wp = WAYPOINTS[nextIdx];
        s.waypointIdx = nextIdx;
        s.targetX = Math.max(half, Math.min(containerW - half, (wp.x / 100) * containerW));
        s.targetY = Math.max(half, Math.min(containerH - half, (wp.y / 100) * containerH));
        s.speed = 0.6 + wp.speedFactor * 1.6;
        if (nextIdx % 3 === 0 && !s.projecting) onProjectionCycle(nextIdx);
      }, pause);
    }

    setRobotPos({ x: s.x, y: s.y, facing: s.facing, bobOffset: s.bobOffset, projecting: s.projecting, imageUrl: s.imageUrl, imageLoaded: s.imageLoaded });
    rafRef.current = requestAnimationFrame(advance);
  }, [active, containerW, containerH, onProjectionCycle]);

  useEffect(() => {
    if (!active) { if (rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    rafRef.current = requestAnimationFrame(advance);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (projTimerRef.current) clearTimeout(projTimerRef.current);
      if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
    };
  }, [active, advance]);

  const triggerProjection = useCallback((url: string) => {
    stateRef.current.projecting = true;
    stateRef.current.imageUrl = url;
    stateRef.current.imageLoaded = false;
  }, []);

  const markImageLoaded = useCallback(() => {
    stateRef.current.imageLoaded = true;
    projTimerRef.current = setTimeout(() => {
      stateRef.current.projecting = false;
      stateRef.current.imageUrl = null;
      stateRef.current.imageLoaded = false;
    }, 6000);
  }, []);

  return { robotPos, triggerProjection, markImageLoaded };
}

// ── ROBOT SVG — bigger, nicer design ─────────────────────────────────────
function RobotBot({ facing, bobOffset, isSpeaking, projecting }: {
  facing: "left" | "right";
  bobOffset: number;
  isSpeaking: boolean;
  projecting: boolean;
}) {
  const glow = isSpeaking
    ? "drop-shadow(0 0 18px rgba(99,102,241,1)) drop-shadow(0 0 36px rgba(139,92,246,0.7)) drop-shadow(0 0 60px rgba(99,102,241,0.35))"
    : "drop-shadow(0 0 8px rgba(99,102,241,0.5)) drop-shadow(0 0 20px rgba(99,102,241,0.2))";

  return (
    <svg
      width={ROBOT_SIZE} height={ROBOT_SIZE}
      viewBox="0 0 120 120"
      fill="none"
      style={{
        transform: `translateY(${bobOffset}px) scaleX(${facing === "left" ? -1 : 1})`,
        transition: "filter 0.3s ease",
        filter: glow,
      }}
    >
      {/* Legs */}
      <rect x="36" y="92" width="16" height="22" rx="6" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5"/>
      <rect x="68" y="92" width="16" height="22" rx="6" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5"/>
      {/* Foot accents */}
      <rect x="36" y="108" width="16" height="6" rx="3" fill="#312e81"/>
      <rect x="68" y="108" width="16" height="6" rx="3" fill="#312e81"/>

      {/* Body */}
      <rect x="28" y="46" width="64" height="50" rx="14" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2"/>
      {/* Body panel */}
      <rect x="40" y="57" width="40" height="26" rx="8" fill={isSpeaking ? "#4f46e5" : "#2d2a6e"} opacity={isSpeaking ? 0.95 : 0.6}/>
      {/* Speaker bars */}
      {isSpeaking
        ? [0,1,2,3,4].map(i => (
            <rect key={i} x={44 + i * 8} y={60} width="3" height={10 + (i % 3) * 6} rx="1.5" fill="#a5b4fc" opacity="0.9"/>
          ))
        : <rect x="44" y="65" width="32" height="2" rx="1" fill="#4f46e5" opacity="0.4"/>
      }
      {/* Body bolts */}
      <circle cx="34" cy="53" r="2.5" fill="#312e81" stroke="#6366f1" strokeWidth="1"/>
      <circle cx="86" cy="53" r="2.5" fill="#312e81" stroke="#6366f1" strokeWidth="1"/>

      {/* Neck */}
      <rect x="50" y="38" width="20" height="12" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5"/>

      {/* Head */}
      <rect x="24" y="10" width="72" height="32" rx="12" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2"/>
      {/* Forehead detail */}
      <rect x="44" y="14" width="32" height="4" rx="2" fill="#312e81" opacity="0.7"/>

      {/* Eyes */}
      <rect x="32" y="22" width="22" height="14" rx="5" fill={isSpeaking ? "#4338ca" : "#1e1b4b"} stroke={isSpeaking ? "#a5b4fc" : "#6366f1"} strokeWidth="1.5"/>
      <rect x="66" y="22" width="22" height="14" rx="5" fill={isSpeaking ? "#4338ca" : "#1e1b4b"} stroke={isSpeaking ? "#a5b4fc" : "#6366f1"} strokeWidth="1.5"/>
      {/* Pupils */}
      <circle cx="43" cy="29" r="4" fill={isSpeaking ? "#c7d2fe" : "#818cf8"}/>
      <circle cx="77" cy="29" r="4" fill={isSpeaking ? "#c7d2fe" : "#818cf8"}/>
      <circle cx="44" cy="28" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="78" cy="28" r="1.5" fill="white" opacity="0.8"/>

      {/* Antenna */}
      <line x1="60" y1="10" x2="60" y2="2" stroke="#6366f1" strokeWidth="2"/>
      <circle cx="60" cy="1" r="4" fill={isSpeaking ? "#a5b4fc" : "#4f46e5"} stroke="#6366f1" strokeWidth="1"/>
      {isSpeaking && <circle cx="60" cy="1" r="7" fill="none" stroke="#a5b4fc" strokeWidth="1" opacity="0.5"/>}

      {/* Arms */}
      <rect x="6" y="50" width="24" height="10" rx="5" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5"/>
      <circle cx="6" cy="55" r="5" fill="#312e81" stroke="#6366f1" strokeWidth="1.5"/>
      <rect x="90" y="50" width="24" height="10" rx="5" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5"/>
      <circle cx="114" cy="55" r="5" fill="#312e81" stroke="#6366f1" strokeWidth="1.5"/>

      {/* Projector dish — extends from right arm */}
      {projecting && (
        <g>
          <line x1="114" y1="55" x2="132" y2="55" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="4 3"/>
          <ellipse cx="138" cy="55" rx="8" ry="14" fill="#1e1b4b" stroke="#a5b4fc" strokeWidth="2" opacity="0.95"/>
          <ellipse cx="138" cy="55" rx="4" ry="8" fill="#6366f1" opacity="0.6"/>
          <circle cx="138" cy="55" r="3" fill="#c7d2fe" opacity="0.9"/>
          {/* Beam rays */}
          <line x1="146" y1="48" x2="158" y2="42" stroke="#a5b4fc" strokeWidth="1" opacity="0.4"/>
          <line x1="146" y1="55" x2="160" y2="55" stroke="#a5b4fc" strokeWidth="1" opacity="0.4"/>
          <line x1="146" y1="62" x2="158" y2="68" stroke="#a5b4fc" strokeWidth="1" opacity="0.4"/>
        </g>
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
  const [currentText, setCurrentText] = useState("");
  const [segCount, setSegCount] = useState(0);

  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const running = useRef(false);
  const sessionOn = useRef(false);
  const segRef = useRef(0);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  // Get or create AudioContext — MUST be called inside a user gesture
  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const AC = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || window.AudioContext;
      if (AC) audioCtxRef.current = new AC();
    }
    return audioCtxRef.current;
  }, []);

  const timeLeft = durationMin * 60 - elapsed;

  const fmt = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── ROBOT ────────────────────────────────────────────────────────────────
  const onProjectionCycle = useCallback(async (wpIdx: number) => {
    if (!sessionOn.current) return;
    const subj = selectedSubject?.label || "Science";
    const prompt = await getImagePrompt(subj, selectedTopic, wpIdx);
    triggerProjection(buildImageUrl(prompt));
  }, [selectedSubject, selectedTopic]);

  const { robotPos, triggerProjection, markImageLoaded } = useRobotAnimation(
    phase === "session",
    containerSize.w,
    containerSize.h,
    onProjectionCycle
  );

  // Measure container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerSize({ w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", () => setTimeout(measure, 350));
    return () => window.removeEventListener("resize", measure);
  }, [phase]);

  // ── SPEAK ────────────────────────────────────────────────────────────────
  const speak = useCallback(async (text: string, onDone: () => void) => {
    cleanupRef.current?.();
    const ctx = getCtx();
    if (!ctx) { onDone(); return; }
    try {
      if (ctx.state === "suspended") await ctx.resume();
      const b64 = await generateSpeech({ data: text, voiceId: PROFESSOR_VOICE_ID });
      const { cleanup } = playBase64Audio(ctx, b64, onDone, () => {
        // fallback: browser TTS
        if (typeof window !== "undefined" && window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 0.9;
          u.onend = onDone;
          window.speechSynthesis.speak(u);
        } else onDone();
      });
      cleanupRef.current = cleanup;
    } catch {
      onDone();
    }
  }, [generateSpeech, getCtx]);

  // ── SEGMENT LOOP ─────────────────────────────────────────────────────────
  const doSegment = useCallback(async () => {
    if (running.current || !sessionOn.current) return;
    running.current = true;
    const subj = selectedSubject?.label || "General Studies";
    const text = await getLessonText(subj, selectedTopic, historyRef.current);
    if (!sessionOn.current) { running.current = false; return; }
    setCurrentText(text);
    setIsSpeaking(true);
    speak(text, () => {
      if (!sessionOn.current) return;
      setIsSpeaking(false);
      historyRef.current = [...historyRef.current.slice(-10), { role: "assistant", content: text }];
      segRef.current += 1;
      setSegCount(segRef.current);
      running.current = false;
      setTimeout(() => { if (sessionOn.current) doSegment(); }, 1500);
    });
  }, [selectedSubject, selectedTopic, speak]);

  // ── START SESSION ─────────────────────────────────────────────────────────
  // startSession must be called directly from a user click to unlock AudioContext
  const startSession = useCallback(async () => {
    // Create + unlock AudioContext while still in user gesture
    const ctx = getCtx();
    if (ctx?.state === "suspended") await ctx.resume().catch(() => {});
    setPhase("loading");
    setElapsed(0);
    segRef.current = 0;
    historyRef.current = [];
    setSegCount(0);
    setCurrentText("");
    sessionOn.current = true;
    // Short delay to let loading screen render, then switch to session
    setTimeout(() => setPhase("session"), 1800);
  }, [getCtx]);

  // Timer
  useEffect(() => {
    if (phase !== "session") return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Start speaking on session
  useEffect(() => {
    if (phase === "session" && segCount === 0 && !running.current) {
      setTimeout(() => doSegment(), 800);
    }
  }, [phase, segCount, doSegment]);

  // Session end
  useEffect(() => {
    if (phase === "session" && timeLeft <= 0) {
      sessionOn.current = false;
      cleanupRef.current?.();
      setPhase("setup");
    }
  }, [phase, timeLeft]);

  // Cleanup on unmount
  useEffect(() => () => {
    sessionOn.current = false;
    cleanupRef.current?.();
    if (timerRef.current) clearInterval(timerRef.current);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  const end = useCallback(() => {
    sessionOn.current = false;
    cleanupRef.current?.();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setPhase("setup");
  }, []);

  // ── SETUP SCREEN ─────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="fixed inset-0 bg-[#050508] text-white flex flex-col overflow-hidden">
      {/* Subtle gradient header glow */}
      <div className="absolute inset-x-0 top-0 h-48 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />

      <header className="relative flex items-center px-5 pt-12 pb-5 flex-shrink-0">
        <button
          onClick={() => navigate({ to: "/more" })}
          className="h-9 w-9 rounded-full bg-white/[0.06] flex items-center justify-center mr-4 hover:bg-white/10 active:scale-95 transition-all"
        >
          <svg className="h-4 w-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">VR Classroom</h1>
          <p className="text-xs text-white/35 mt-0.5">Floating AI bot · Live voice · Real-time images</p>
        </div>
        <div className="flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-500/25 rounded-full px-3 py-1.5">
          <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">AI Live</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-4">Subject</p>
        <div className="grid grid-cols-2 gap-2.5 mb-8">
          {SUBJECTS.map((subj) => (
            <button
              key={subj.id}
              onClick={() => { setSelectedSubject(subj); setSelectedTopic(""); }}
              className={`rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.97] border relative overflow-hidden ${
                selectedSubject?.id === subj.id
                  ? `bg-gradient-to-br ${subj.color} border-white/20`
                  : "bg-white/[0.04] border-white/[0.05] hover:bg-white/[0.07]"
              }`}
            >
              <div className="text-2xl mb-2 leading-none">{subj.icon}</div>
              <div className="text-sm font-semibold leading-tight">{subj.label}</div>
            </button>
          ))}
        </div>

        {selectedSubject && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-4">Topic</p>
            <div className="flex flex-wrap gap-2">
              {selectedSubject.topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
                    selectedTopic === topic
                      ? `bg-gradient-to-r ${selectedSubject.color} text-white`
                      : "bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
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
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDurationMin(d)}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all duration-200 active:scale-95 ${
                    durationMin === d
                      ? "bg-white text-black shadow-lg"
                      : "bg-white/[0.05] text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/20 mt-2.5 text-center">Minimum 20 min · Full landscape session</p>
          </div>
        )}

        {selectedSubject && selectedTopic && (
          <button
            onClick={startSession}
            className={`w-full py-4 rounded-2xl font-bold text-base text-white transition-all duration-200 active:scale-[0.98] bg-gradient-to-r ${selectedSubject.color} shadow-2xl`}
            style={{ boxShadow: "0 8px 32px rgba(99,102,241,0.35)" }}
          >
            Enter VR Classroom · {durationMin} min
          </button>
        )}
      </div>
    </div>
  );

  // ── LOADING SCREEN ────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-8 text-white">
      {/* Animated bot preview */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(99,102,241,0.15)", width: "140px", height: "140px", left: "-10px", top: "-10px" }} />
        <RobotBot facing="right" bobOffset={0} isSpeaking={true} projecting={false} />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Preparing Your Classroom</h2>
        <p className="text-sm text-white/40">{selectedSubject?.label} · {selectedTopic}</p>
      </div>
      <div className="flex items-center gap-2">
        {[0,1,2].map(i => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );

  // ── SESSION — PURE BLACK FULLSCREEN ──────────────────────────────────────
  const projFacing = robotPos.facing;

  return (
    <>
      <style>{`
        @media screen and (orientation: portrait) {
          #vr-root {
            transform: rotate(90deg);
            transform-origin: center center;
            width: 100vh;
            height: 100vw;
            position: fixed;
            top: calc((100vh - 100vw) / 2);
            left: calc((100vw - 100vh) / 2);
            overflow: hidden;
          }
        }
        @media screen and (orientation: landscape) {
          #vr-root {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100dvh;
          }
        }
        @keyframes imgFadeIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes beamPulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.8; }
        }
      `}</style>

      {/* Pure black canvas */}
      <div id="vr-root" className="bg-black overflow-hidden" ref={containerRef}>

        {/* Very subtle vignette for depth */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)" }} />

        {/* ── FLOATING ROBOT ─────────────────────────────────────────── */}
        {containerSize.w > 0 && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: robotPos.x,
              top: robotPos.y + robotPos.bobOffset,
              transform: "translate(-50%, -50%)",
              transition: "left 0.06s linear, top 0.06s linear",
              willChange: "left, top",
            }}
          >
            {/* Ambient glow under bot */}
            <div
              className="absolute rounded-full"
              style={{
                width: "160px", height: "40px",
                left: "-20px", bottom: "-20px",
                background: `radial-gradient(ellipse, rgba(99,102,241,${isSpeaking ? 0.25 : 0.1}) 0%, transparent 70%)`,
                filter: "blur(8px)",
              }}
            />

            {/* Projected image */}
            {robotPos.projecting && robotPos.imageUrl && (
              <div
                className="absolute z-10"
                style={{
                  [projFacing === "right" ? "left" : "right"]: "130px",
                  top: "-70px",
                  width: "220px",
                  animation: "imgFadeIn 0.5s ease forwards",
                }}
              >
                {/* Beam */}
                <div
                  className="absolute"
                  style={{
                    [projFacing === "right" ? "right" : "left"]: "100%",
                    top: "50%",
                    width: "38px",
                    height: "3px",
                    transform: "translateY(-50%)",
                    background: "linear-gradient(to right, transparent, rgba(165,180,252,0.7))",
                    animation: "beamPulse 1s infinite",
                  }}
                />
                {/* Frame */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    border: "1.5px solid rgba(165,180,252,0.35)",
                    boxShadow: "0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2)",
                    background: "#050510",
                  }}
                >
                  {!robotPos.imageLoaded && (
                    <div className="flex items-center justify-center h-28 gap-2">
                      <div className="h-5 w-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    </div>
                  )}
                  <img
                    src={robotPos.imageUrl}
                    alt=""
                    className="w-full h-auto block"
                    style={{ maxHeight: "140px", objectFit: "cover", display: robotPos.imageLoaded ? "block" : "none" }}
                    onLoad={markImageLoaded}
                    onError={markImageLoaded}
                  />
                </div>
              </div>
            )}

            {/* The bot */}
            <RobotBot
              facing={robotPos.facing}
              bobOffset={0}
              isSpeaking={isSpeaking}
              projecting={robotPos.projecting}
            />

            {/* Speaking ring */}
            {isSpeaking && (
              <div
                className="absolute rounded-full animate-ping pointer-events-none"
                style={{
                  width: ROBOT_SIZE + 30 + "px",
                  height: ROBOT_SIZE + 30 + "px",
                  left: -15 + "px",
                  top: -15 + "px",
                  background: "rgba(99,102,241,0.08)",
                }}
              />
            )}
          </div>
        )}

        {/* Only UI element: small exit button bottom-right */}
        <button
          onClick={end}
          className="absolute bottom-5 right-5 z-50 h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <svg className="h-4 w-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Timer — tiny, bottom-left */}
        <div
          className="absolute bottom-5 left-5 z-50 font-mono text-[11px] tabular-nums"
          style={{ color: timeLeft < 300 ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.2)" }}
        >
          {fmt(Math.max(0, timeLeft))}
        </div>

        {/* Speaking indicator — just a thin glowing line at bottom */}
        {isSpeaking && (
          <div className="absolute bottom-0 left-0 right-0 z-40 h-0.5" style={{ background: "linear-gradient(to right, transparent, rgba(99,102,241,0.7), rgba(139,92,246,0.7), transparent)" }} />
        )}
      </div>
    </>
  );
}
