import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef, useCallback } from "react";
import { generateSpeechFn } from "./speech-fn";

export const Route = createFileRoute("/vr-classroom")({
  head: () => ({ meta: [{ title: "VR Classroom — The Flow" }] }),
  component: VrClassroomPage,
});

const PROFESSOR_VOICE_ID = "ef191366-f52f-447a-a398-ed8c0f2943a1";
const SPHERE_R = 60; // radius in px — total rendered size = 2*SPHERE_R

// ── AUDIO ────────────────────────────────────────────────────────────────
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
  return {
    cleanup: () => {
      active = false;
      if (source) { try { source.stop(); } catch (_e) {} }
    },
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
async function getLessonText(subject: string, topic: string, history: { role: string; content: string }[]): Promise<string> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: `You are a brilliant AI professor teaching ${subject} on "${topic}". 3–4 vivid sentences per segment. Progress the lecture. Real-world analogies. No markdown, no bullets.` },
          ...history,
          { role: "user", content: "Continue." },
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
        messages: [{ role: "system", content: `Image prompt for ${subject} concept "${topic}" segment ${seg}. Visual, educational. Under 18 words. No quotes.` }],
        max_tokens: 40, temperature: 0.8,
      }),
    });
    const d = await res.json();
    return d.choices?.[0]?.message?.content?.trim() || `${topic} concept art`;
  } catch { return `${topic} educational diagram`; }
}

function buildImageUrl(prompt: string): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ", dark background, vibrant")}?width=480&height=300&nologo=true`;
}

// ── WAYPOINTS — kept in 20–80% range so bot is always fully visible ───────
const WAYPOINTS = [
  { x: 20, y: 30, s: 1.2 },
  { x: 55, y: 22, s: 2.0 },
  { x: 78, y: 40, s: 0.6 },
  { x: 65, y: 65, s: 1.5 },
  { x: 35, y: 72, s: 0.8 },
  { x: 18, y: 55, s: 1.8 },
  { x: 42, y: 45, s: 0.5 },
  { x: 70, y: 28, s: 2.2 },
  { x: 50, y: 70, s: 1.0 },
  { x: 25, y: 40, s: 1.4 },
];

interface SphereState {
  x: number; y: number;
  tx: number; ty: number;
  wpIdx: number; speed: number;
  bob: number; frame: number;
  projecting: boolean;
  imageUrl: string | null;
  imageLoaded: boolean;
  facing: "left" | "right";
}

function useSphereAnimation(
  active: boolean,
  W: number,
  H: number,
  onProject: (idx: number) => void
) {
  const PAD = SPHERE_R + 8;
  const s = useRef<SphereState>({
    x: W * 0.5, y: H * 0.5, tx: W * 0.5, ty: H * 0.5,
    wpIdx: 0, speed: 1.5, bob: 0, frame: 0,
    projecting: false, imageUrl: null, imageLoaded: false, facing: "right",
  });
  const [pos, setPos] = useState({ x: W * 0.5, y: H * 0.5, bob: 0, facing: "right" as "left" | "right", projecting: false, imageUrl: null as string | null, imageLoaded: false });
  const raf = useRef<number | null>(null);
  const arrTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const projTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tick = useCallback(() => {
    if (!active) return;
    const st = s.current;
    st.frame++;
    st.bob = Math.sin(st.frame * 0.04) * 8;

    const dx = st.tx - st.x;
    const dy = st.ty - st.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1.5) {
      const mv = Math.min(dist, st.speed);
      st.x += (dx / dist) * mv;
      st.y += (dy / dist) * mv;
      if (dx !== 0) st.facing = dx > 0 ? "right" : "left";
    } else if (!arrTimer.current) {
      const pause = 400 + Math.random() * 1600;
      arrTimer.current = setTimeout(() => {
        arrTimer.current = null;
        const ni = (st.wpIdx + 1) % WAYPOINTS.length;
        const wp = WAYPOINTS[ni];
        st.wpIdx = ni;
        st.tx = Math.max(PAD, Math.min(W - PAD, (wp.x / 100) * W));
        st.ty = Math.max(PAD, Math.min(H - PAD, (wp.y / 100) * H));
        st.speed = 0.5 + wp.s * 1.4;
        if (ni % 3 === 0 && !st.projecting) onProject(ni);
      }, pause);
    }

    setPos({ x: st.x, y: st.y, bob: st.bob, facing: st.facing, projecting: st.projecting, imageUrl: st.imageUrl, imageLoaded: st.imageLoaded });
    raf.current = requestAnimationFrame(tick);
  }, [active, W, H, onProject, PAD]);

  useEffect(() => {
    if (!active) { if (raf.current) cancelAnimationFrame(raf.current); return; }
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      if (arrTimer.current) clearTimeout(arrTimer.current);
      if (projTimer.current) clearTimeout(projTimer.current);
    };
  }, [active, tick]);

  const triggerProjection = useCallback((url: string) => {
    s.current.projecting = true;
    s.current.imageUrl = url;
    s.current.imageLoaded = false;
  }, []);

  const markLoaded = useCallback(() => {
    s.current.imageLoaded = true;
    projTimer.current = setTimeout(() => {
      s.current.projecting = false;
      s.current.imageUrl = null;
      s.current.imageLoaded = false;
    }, 6000);
  }, []);

  return { pos, triggerProjection, markLoaded };
}

// ── SPHERE BOT — single glowing sphere with one eye ───────────────────────
function SpherBot({ bob, isSpeaking, projecting, facing }: {
  bob: number; isSpeaking: boolean; projecting: boolean; facing: "left" | "right";
}) {
  const D = SPHERE_R * 2;
  const R = SPHERE_R;
  const glowColor = isSpeaking ? "rgba(99,102,241,1)" : "rgba(99,102,241,0.5)";
  const glowSpread = isSpeaking ? 32 : 14;
  const glowOuter = isSpeaking ? 60 : 24;

  return (
    <svg
      width={D + 40} height={D + 40}
      viewBox={`-20 -20 ${D + 40} ${D + 40}`}
      fill="none"
      style={{
        transform: `translateY(${bob}px)`,
        filter: `drop-shadow(0 0 ${glowSpread}px ${glowColor}) drop-shadow(0 0 ${glowOuter}px rgba(99,102,241,0.25))`,
        transition: "filter 0.4s ease",
        overflow: "visible",
      }}
    >
      {/* Outer pulse ring when speaking */}
      {isSpeaking && (
        <circle cx={R} cy={R} r={R + 14} fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="2">
          <animate attributeName="r" values={`${R + 10};${R + 20};${R + 10}`} dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="1.6s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Sphere base — dark with subtle gradient */}
      <defs>
        <radialGradient id="sphGrad" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#2d2a6e"/>
          <stop offset="60%" stopColor="#1a1740"/>
          <stop offset="100%" stopColor="#0c0b28"/>
        </radialGradient>
        <radialGradient id="sphGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(99,102,241,0.15)"/>
          <stop offset="100%" stopColor="rgba(99,102,241,0)"/>
        </radialGradient>
        <radialGradient id="eyeGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor={isSpeaking ? "#c7d2fe" : "#a5b4fc"}/>
          <stop offset="100%" stopColor={isSpeaking ? "#6366f1" : "#4338ca"}/>
        </radialGradient>
      </defs>

      {/* Shadow ellipse */}
      <ellipse cx={R} cy={R * 2 + 6} rx={R * 0.65} ry={6} fill="rgba(0,0,0,0.35)" />

      {/* Main sphere */}
      <circle cx={R} cy={R} r={R} fill="url(#sphGrad)" stroke="#6366f1" strokeWidth="1.5" />
      {/* Inner glow */}
      <circle cx={R} cy={R} r={R} fill="url(#sphGlow)" />
      {/* Highlight specular */}
      <ellipse cx={R * 0.65} cy={R * 0.5} rx={R * 0.22} ry={R * 0.14} fill="rgba(255,255,255,0.18)" />

      {/* THE EYE — big single eye centered, pupil tracks facing direction */}
      {/* Eye white */}
      <ellipse cx={R} cy={R} rx={R * 0.42} ry={R * 0.38} fill="rgba(230,235,255,0.95)" />
      {/* Iris */}
      <circle cx={R + (facing === "right" ? R * 0.06 : -R * 0.06)} cy={R} r={R * 0.26} fill="url(#eyeGrad)" />
      {/* Pupil */}
      <circle cx={R + (facing === "right" ? R * 0.08 : -R * 0.08)} cy={R} r={R * 0.13} fill="#0c0b28" />
      {/* Eye glint */}
      <circle cx={R + (facing === "right" ? R * 0.04 : -R * 0.04) - 4} cy={R - 5} r={R * 0.055} fill="white" opacity="0.9" />
      {/* Eyelid top */}
      <path d={`M ${R - R * 0.42} ${R} Q ${R} ${R - R * 0.52} ${R + R * 0.42} ${R}`} fill="#1a1740" />

      {/* Speaking indicator: small animated dots on lower hemisphere */}
      {isSpeaking && [0,1,2,3,4].map(i => {
        const angle = (Math.PI * 0.35) + i * (Math.PI * 0.065);
        const ex = R + Math.cos(angle) * R * 0.68;
        const ey = R + Math.sin(angle) * R * 0.72;
        return (
          <circle key={i} cx={ex} cy={ey} r="3" fill="#a5b4fc" opacity="0.7">
            <animate attributeName="r" values={`2;4;2`} dur="0.8s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
          </circle>
        );
      })}

      {/* Projector beam nozzle on the side the sphere is facing */}
      {projecting && (
        <g transform={facing === "left" ? `scale(-1,1) translate(${-D},0)` : ""}>
          <line x1={D} y1={R} x2={D + 12} y2={R} stroke="#a5b4fc" strokeWidth="2" strokeDasharray="4 3">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite"/>
          </line>
          <ellipse cx={D + 16} cy={R} rx="5" ry="9" fill="#312e81" stroke="#a5b4fc" strokeWidth="1.5"/>
          <circle cx={D + 16} cy={R} r="3" fill="#c7d2fe" opacity="0.9"/>
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
  const [segCount, setSegCount] = useState(0);

  // The container must fill the full screen — measured after mount
  const [cSize, setCSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // AudioContext is stored across renders — created once on the Enter button tap
  const audioCtxRef = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const running = useRef(false);
  const sessionOn = useRef(false);
  const segRef = useRef(0);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  const timeLeft = durationMin * 60 - elapsed;
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── SPHERE ────────────────────────────────────────────────────────────────
  const onProject = useCallback(async (idx: number) => {
    if (!sessionOn.current) return;
    const prompt = await getImagePrompt(selectedSubject?.label || "Science", selectedTopic, idx);
    triggerProjection(buildImageUrl(prompt));
  }, [selectedSubject, selectedTopic]);

  const { pos, triggerProjection, markLoaded } = useSphereAnimation(
    phase === "session", cSize.w, cSize.h, onProject
  );

  // Measure container whenever phase changes (session mounts a new div)
  useEffect(() => {
    if (phase !== "session") return;
    const measure = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setCSize({ w: r.width || window.innerWidth, h: r.height || window.innerHeight });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("orientationchange", () => setTimeout(measure, 400));
    return () => { ro.disconnect(); };
  }, [phase]);

  // ── SPEAK ─────────────────────────────────────────────────────────────────
  // Uses the pre-unlocked AudioContext stored in audioCtxRef
  const speak = useCallback(async (text: string, onDone: () => void) => {
    cleanupRef.current?.();
    const ctx = audioCtxRef.current;
    if (!ctx) { onDone(); return; }
    try {
      if (ctx.state === "suspended") await ctx.resume();
      const b64 = await generateSpeech({ data: text, voiceId: PROFESSOR_VOICE_ID });
      const { cleanup } = playBase64Audio(ctx, b64, onDone, () => {
        // browser TTS fallback
        if (window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 0.9;
          u.onend = onDone;
          window.speechSynthesis.speak(u);
        } else onDone();
      });
      cleanupRef.current = cleanup;
    } catch { onDone(); }
  }, [generateSpeech]);

  // ── SEGMENT LOOP ──────────────────────────────────────────────────────────
  const doSegment = useCallback(async () => {
    if (running.current || !sessionOn.current) return;
    running.current = true;
    const text = await getLessonText(selectedSubject?.label || "Science", selectedTopic, historyRef.current);
    if (!sessionOn.current) { running.current = false; return; }
    setIsSpeaking(true);
    speak(text, () => {
      if (!sessionOn.current) return;
      setIsSpeaking(false);
      historyRef.current = [...historyRef.current.slice(-10), { role: "assistant", content: text }];
      segRef.current++;
      setSegCount(segRef.current);
      running.current = false;
      setTimeout(() => { if (sessionOn.current) doSegment(); }, 1200);
    });
  }, [selectedSubject, selectedTopic, speak]);

  // ── ENTER — called directly by button tap ─────────────────────────────────
  const startSession = useCallback(async () => {
    // 1. Create and UNLOCK AudioContext inside the user gesture
    const AC = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || window.AudioContext;
    const ctx = new AC();
    audioCtxRef.current = ctx;
    // Calling resume() here while still inside the tap event
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    // 2. Reset state
    setElapsed(0);
    segRef.current = 0;
    historyRef.current = [];
    setSegCount(0);
    setIsSpeaking(false);
    sessionOn.current = true;

    // 3. Show loading briefly, then session
    setPhase("loading");
    setTimeout(() => setPhase("session"), 1400);
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "session") return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Kick off first segment once session + container are ready
  useEffect(() => {
    if (phase === "session" && cSize.w > 0 && segCount === 0 && !running.current) {
      setTimeout(() => doSegment(), 600);
    }
  }, [phase, cSize.w, segCount, doSegment]);

  // End when time runs out
  useEffect(() => {
    if (phase === "session" && timeLeft <= 0) {
      sessionOn.current = false;
      cleanupRef.current?.();
      setPhase("setup");
    }
  }, [phase, timeLeft]);

  // Cleanup
  useEffect(() => () => {
    sessionOn.current = false;
    cleanupRef.current?.();
    if (timerRef.current) clearInterval(timerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  const end = useCallback(() => {
    sessionOn.current = false;
    cleanupRef.current?.();
    window.speechSynthesis?.cancel();
    setPhase("setup");
  }, []);

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="fixed inset-0 bg-[#050508] text-white flex flex-col overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-48 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />
      <header className="relative flex items-center px-5 pt-12 pb-5 flex-shrink-0">
        <button onClick={() => navigate({ to: "/more" })} className="h-9 w-9 rounded-full bg-white/[0.06] flex items-center justify-center mr-4 hover:bg-white/10 active:scale-95 transition-all">
          <svg className="h-4 w-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">VR Classroom</h1>
          <p className="text-xs text-white/35 mt-0.5">Floating AI sphere · Live voice · Real-time images</p>
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
              {selectedSubject.topics.map((topic) => (
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
              {DURATION_OPTIONS.map((d) => (
                <button key={d} onClick={() => setDurationMin(d)}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all active:scale-95 ${durationMin === d ? "bg-white text-black" : "bg-white/[0.05] text-white/50 hover:bg-white/10 hover:text-white"}`}>
                  {d}m
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/20 mt-2.5 text-center">Minimum 20 min · Full landscape</p>
          </div>
        )}

        {selectedSubject && selectedTopic && (
          <button onClick={startSession}
            className={`w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] bg-gradient-to-r ${selectedSubject.color}`}
            style={{ boxShadow: "0 8px 32px rgba(99,102,241,0.35)" }}>
            Enter VR Classroom · {durationMin} min
          </button>
        )}
      </div>
    </div>
  );

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-8 text-white">
      <SpherBot bob={0} isSpeaking={true} projecting={false} facing="right" />
      <div className="text-center">
        <p className="text-base font-semibold text-white/70">{selectedSubject?.label} · {selectedTopic}</p>
      </div>
      <div className="flex items-center gap-2">
        {[0, 1, 2].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
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
            top: 0; left: 0;
            width: 100vh !important;
            height: 100vw !important;
            transform: rotate(90deg) translateX(0);
            transform-origin: top left;
            left: 100vw;
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
        @keyframes imgIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
        @keyframes beamBlink { 0%,100%{opacity:.3} 50%{opacity:.9} }
      `}</style>

      <div id="vr-root" className="bg-black overflow-hidden" ref={containerRef}>

        {/* Sphere bot */}
        {cSize.w > 0 && (
          <div className="absolute z-20 pointer-events-none"
            style={{
              left: pos.x,
              top: pos.y + pos.bob,
              transform: "translate(-50%, -50%)",
              transition: "left 0.06s linear, top 0.06s linear",
              willChange: "left, top",
            }}
          >
            {/* Projected image */}
            {pos.projecting && pos.imageUrl && (
              <div className="absolute z-10"
                style={{
                  [pos.facing === "right" ? "left" : "right"]: SPHERE_R * 2 + 30 + "px",
                  top: -(SPHERE_R * 0.8) + "px",
                  width: "200px",
                  animation: "imgIn 0.5s ease forwards",
                }}>
                <div className="absolute"
                  style={{
                    [pos.facing === "right" ? "right" : "left"]: "100%",
                    top: "50%", width: "32px", height: "2px",
                    transform: "translateY(-50%)",
                    background: "linear-gradient(to right, transparent, rgba(165,180,252,0.6))",
                    animation: "beamBlink 1s infinite",
                  }}
                />
                <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(165,180,252,0.3)", boxShadow: "0 0 30px rgba(99,102,241,0.45)", background: "#050510" }}>
                  {!pos.imageLoaded && (
                    <div className="flex items-center justify-center h-24">
                      <div className="h-5 w-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    </div>
                  )}
                  <img src={pos.imageUrl} alt="" className="w-full h-auto block" style={{ maxHeight: "130px", objectFit: "cover", display: pos.imageLoaded ? "block" : "none" }} onLoad={markLoaded} onError={markLoaded} />
                </div>
              </div>
            )}

            <SpherBot bob={0} isSpeaking={isSpeaking} projecting={pos.projecting} facing={pos.facing} />
          </div>
        )}

        {/* Exit — tiny, bottom right */}
        <button onClick={end} className="absolute bottom-5 right-5 z-50 h-9 w-9 rounded-full flex items-center justify-center active:scale-90 transition-all"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <svg className="h-4 w-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Timer — barely visible bottom-left */}
        <div className="absolute bottom-5 left-5 z-50 font-mono text-[10px] tabular-nums select-none"
          style={{ color: timeLeft < 300 ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.18)" }}>
          {fmt(Math.max(0, timeLeft))}
        </div>

        {/* Speaking glow line at very bottom */}
        {isSpeaking && (
          <div className="absolute bottom-0 left-0 right-0 h-px z-40"
            style={{ background: "linear-gradient(to right, transparent, rgba(99,102,241,0.6), rgba(139,92,246,0.6), transparent)" }} />
        )}
      </div>
    </>
  );
}
