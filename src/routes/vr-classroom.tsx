import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef, useCallback } from "react";
import { generateSpeechFn } from "./speech-fn";

export const Route = createFileRoute("/vr-classroom")({
  head: () => ({ meta: [{ title: "VR Classroom — The Flow" }] }),
  component: VrClassroomPage,
});

const PROFESSOR_VOICE_ID = "ef191366-f52f-447a-a398-ed8c0f2943a1";

function playBase64Audio(
  ctx: AudioContext,
  base64: string,
  onEnded: () => void,
  onError: () => void
): { cleanup: () => void } {
  let source: AudioBufferSourceNode | null = null;
  let active = true;
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    ctx.decodeAudioData(
      bytes.buffer.slice(0),
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

const SUBJECTS = [
  { id: "math",        label: "Mathematics",  icon: "∑",   color: "from-indigo-600 to-violet-700",  topics: ["Calculus", "Algebra", "Statistics", "Geometry", "Number Theory"] },
  { id: "physics",     label: "Physics",       icon: "⚛",   color: "from-cyan-600 to-blue-700",      topics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Quantum Physics", "Optics"] },
  { id: "chemistry",   label: "Chemistry",     icon: "⚗",   color: "from-emerald-600 to-teal-700",   topics: ["Organic Chemistry", "Inorganic", "Physical Chemistry", "Biochemistry", "Analytical"] },
  { id: "biology",     label: "Biology",       icon: "🧬",  color: "from-green-600 to-emerald-700",  topics: ["Cell Biology", "Genetics", "Ecology", "Human Anatomy", "Evolution"] },
  { id: "history",     label: "History",       icon: "📜",  color: "from-amber-600 to-orange-700",   topics: ["Ancient History", "World Wars", "African History", "Colonial Era", "Modern History"] },
  { id: "programming", label: "Programming",   icon: "</>", color: "from-rose-600 to-pink-700",      topics: ["Python", "JavaScript", "Algorithms", "Data Structures", "System Design"] },
  { id: "economics",   label: "Economics",     icon: "📈",  color: "from-yellow-600 to-amber-700",   topics: ["Microeconomics", "Macroeconomics", "Finance", "Game Theory", "Development"] },
  { id: "literature",  label: "Literature",    icon: "📚",  color: "from-purple-600 to-fuchsia-700", topics: ["Poetry", "Fiction", "Drama", "Essay Writing", "Literary Analysis"] },
];

const DURATION_OPTIONS = [20, 30, 45, 60, 90];

async function getLessonText(subject: string, topic: string, history: { role: string; content: string }[]): Promise<string> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: `You are a brilliant AI professor teaching ${subject} on "${topic}". You are in a live holographic classroom. Keep each segment to 3-4 vivid sentences. Progress the lecture. Use real analogies. No markdown, no bullets.` },
          ...history,
          { role: "user", content: "Continue the lecture." },
        ],
        max_tokens: 150, temperature: 0.75,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "Let us continue exploring this fascinating topic...";
  } catch { return "Let us continue exploring this fascinating topic..."; }
}

async function getImagePrompt(subject: string, topic: string, seg: number): Promise<string> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: `Create a vivid image generation prompt for a ${subject} concept about "${topic}" (segment ${seg}). Make it visual, educational, beautiful. Under 20 words. No quotes.` }],
        max_tokens: 40, temperature: 0.8,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || `${topic} educational diagram concept art`;
  } catch { return `${topic} educational concept art`; }
}

function buildImageUrl(prompt: string): string {
  const encoded = encodeURIComponent(prompt + ", educational, detailed, vibrant, dark background");
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=320&nologo=true&enhance=true`;
}

// ── ROBOT WAYPOINT SYSTEM ──────────────────────────────────────────────────
// Robot moves between waypoints on the landscape screen (% of W x H)
// Speed varies: sometimes fast dash, sometimes slow drift, sometimes stop & hover
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

interface RobotState {
  x: number; // px
  y: number; // px
  targetX: number;
  targetY: number;
  waypointIdx: number;
  speed: number; // px per frame
  bobOffset: number;
  projecting: boolean;   // dish is extended
  projDone: boolean;     // image shown, dish retracted
  imageUrl: string | null;
  imageLoaded: boolean;
  facing: "left" | "right";
}

function useRobotAnimation(
  active: boolean,
  containerW: number,
  containerH: number,
  onProjectionCycle: (wpIdx: number) => void
) {
  const stateRef = useRef<RobotState>({
    x: containerW * 0.5,
    y: containerH * 0.4,
    targetX: containerW * 0.5,
    targetY: containerH * 0.4,
    waypointIdx: 0,
    speed: 1.8,
    bobOffset: 0,
    projecting: false,
    projDone: false,
    imageUrl: null,
    imageLoaded: false,
    facing: "right",
  });
  const [robotPos, setRobotPos] = useState({ x: containerW * 0.5, y: containerH * 0.4, facing: "right" as "left" | "right", bobOffset: 0, projecting: false, projDone: false, imageUrl: null as string | null, imageLoaded: false });
  const rafRef = useRef<number | null>(null);
  const projTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef(0);

  const advance = useCallback(() => {
    if (!active) return;
    const s = stateRef.current;
    const W = containerW; const H = containerH;
    const ROBOT_W = 72; const ROBOT_H = 72;

    // Bob
    frameRef.current += 1;
    s.bobOffset = Math.sin(frameRef.current * 0.04) * 5;

    // Move towards target
    const dx = s.targetX - s.x;
    const dy = s.targetY - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 2) {
      const move = Math.min(dist, s.speed);
      s.x += (dx / dist) * move;
      s.y += (dy / dist) * move;
      if (dx !== 0) s.facing = dx > 0 ? "right" : "left";
    } else {
      // arrived at waypoint — pick next after a pause
      if (!arrivalTimerRef.current) {
        const pauseMs = 400 + Math.random() * 1200;
        arrivalTimerRef.current = setTimeout(() => {
          arrivalTimerRef.current = null;
          const nextIdx = (s.waypointIdx + 1) % WAYPOINTS.length;
          const wp = WAYPOINTS[nextIdx];
          s.waypointIdx = nextIdx;
          s.targetX = Math.max(ROBOT_W / 2, Math.min(W - ROBOT_W / 2, (wp.x / 100) * W));
          s.targetY = Math.max(ROBOT_H / 2, Math.min(H - ROBOT_H / 2, (wp.y / 100) * H));
          s.speed = 0.8 + wp.speedFactor * 1.4;
          // trigger projection every 3rd waypoint
          if (nextIdx % 3 === 0 && !s.projecting) {
            onProjectionCycle(nextIdx);
          }
        }, pauseMs);
      }
    }

    setRobotPos({ x: s.x, y: s.y, facing: s.facing, bobOffset: s.bobOffset, projecting: s.projecting, projDone: s.projDone, imageUrl: s.imageUrl, imageLoaded: s.imageLoaded });
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
    stateRef.current.projDone = false;
    stateRef.current.imageUrl = url;
    stateRef.current.imageLoaded = false;
  }, []);

  const markImageLoaded = useCallback(() => {
    stateRef.current.imageLoaded = true;
    // retract dish after 5s
    projTimerRef.current = setTimeout(() => {
      stateRef.current.projecting = false;
      stateRef.current.projDone = true;
      stateRef.current.imageUrl = null;
      stateRef.current.imageLoaded = false;
    }, 5000);
  }, []);

  return { robotPos, triggerProjection, markImageLoaded, stateRef };
}

// ── ROBOT SVG COMPONENT ────────────────────────────────────────────────────
function RobotBot({ facing, bobOffset, isSpeaking, projecting }: {
  facing: "left" | "right";
  bobOffset: number;
  isSpeaking: boolean;
  projecting: boolean;
}) {
  return (
    <svg
      width="72" height="72" viewBox="0 0 72 72" fill="none"
      style={{
        transform: `translateY(${bobOffset}px) scaleX(${facing === "left" ? -1 : 1})`,
        transition: "transform 0.15s ease",
        filter: isSpeaking
          ? "drop-shadow(0 0 12px rgba(99,102,241,0.9)) drop-shadow(0 0 24px rgba(99,102,241,0.5))"
          : "drop-shadow(0 0 6px rgba(99,102,241,0.4))",
      }}
    >
      {/* Body */}
      <rect x="18" y="28" width="36" height="28" rx="8" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5"/>
      {/* Chest glow */}
      <rect x="26" y="35" width="20" height="12" rx="4" fill={isSpeaking ? "#6366f1" : "#312e81"} opacity={isSpeaking ? 0.9 : 0.5}/>
      {/* Speaker bars on chest */}
      {isSpeaking && [0,1,2,3].map(i => (
        <rect key={i} x={28 + i * 5} y={38 + Math.sin(Date.now() / 200 + i) * 3} width="2" height={4 + i * 1.5} rx="1" fill="white" opacity="0.8"/>
      ))}
      {/* Head */}
      <rect x="22" y="10" width="28" height="22" rx="7" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5"/>
      {/* Eyes */}
      <circle cx="30" cy="20" r="4" fill={isSpeaking ? "#a5b4fc" : "#6366f1"}/>
      <circle cx="42" cy="20" r="4" fill={isSpeaking ? "#a5b4fc" : "#6366f1"}/>
      <circle cx="31" cy="19" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="43" cy="19" r="1.5" fill="white" opacity="0.8"/>
      {/* Antenna */}
      <line x1="36" y1="10" x2="36" y2="4" stroke="#6366f1" strokeWidth="1.5"/>
      <circle cx="36" cy="3" r="2.5" fill={isSpeaking ? "#a5b4fc" : "#4f46e5"}/>
      {/* Arms */}
      <rect x="7" y="30" width="12" height="6" rx="3" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.2"/>
      <rect x="53" y="30" width="12" height="6" rx="3" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.2"/>
      {/* Legs */}
      <rect x="23" y="55" width="10" height="12" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.2"/>
      <rect x="39" y="55" width="10" height="12" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.2"/>
      {/* Projector dish on front (right side) */}
      {projecting && (
        <g>
          <line x1="65" y1="33" x2="80" y2="33" stroke="#a5b4fc" strokeWidth="1.5" strokeDasharray="3 2"/>
          <ellipse cx="83" cy="33" rx="6" ry="10" fill="#312e81" stroke="#a5b4fc" strokeWidth="1.5" opacity="0.9"/>
          <circle cx="83" cy="33" r="3" fill="#a5b4fc" opacity="0.7"/>
        </g>
      )}
    </svg>
  );
}

// ── MAIN PAGE COMPONENT ────────────────────────────────────────────────────
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
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);

  // Container size for robot
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const running = useRef(false);
  const sessionOn = useRef(false);
  const segRef = useRef(0);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) audioCtxRef.current = new AC();
    }
    return audioCtxRef.current;
  }, []);

  const fmt = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const timeLeft = durationMin * 60 - elapsed;

  // ── ROBOT + IMAGE PROJECTION ─────────────────────────────────────────────
  const onProjectionCycle = useCallback(
    async (wpIdx: number) => {
      if (!sessionOn.current) return;
      const subj = selectedSubject?.label || "Science";
      const prompt = await getImagePrompt(subj, selectedTopic, wpIdx);
      const url = buildImageUrl(prompt);
      triggerProjection(url);
    },
    [selectedSubject, selectedTopic]
  );

  const { robotPos, triggerProjection, markImageLoaded } = useRobotAnimation(
    phase === "session",
    containerSize.w,
    containerSize.h,
    onProjectionCycle
  );

  // Measure container on mount + resize
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerSize({ w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", () => setTimeout(measure, 300));
    return () => { window.removeEventListener("resize", measure); };
  }, [phase]);

  const speak = useCallback(
    async (text: string, onDone: () => void) => {
      cleanupRef.current?.();
      const ctx = getCtx();
      if (!ctx) { onDone(); return; }
      if (ctx.state === "suspended") await ctx.resume().catch(() => {});
      try {
        const b64 = await generateSpeech({ data: text, voiceId: PROFESSOR_VOICE_ID });
        const { cleanup } = playBase64Audio(ctx, b64, onDone, () => {
          if (typeof window !== "undefined" && window.speechSynthesis) {
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 0.92;
            u.onend = onDone;
            window.speechSynthesis.speak(u);
          } else onDone();
        });
        cleanupRef.current = cleanup;
      } catch { onDone(); }
    },
    [generateSpeech, getCtx]
  );

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
      setHistory([...historyRef.current]);
      segRef.current += 1;
      setSegCount(segRef.current);
      running.current = false;
      setTimeout(() => { if (sessionOn.current) doSegment(); }, 1800);
    });
  }, [selectedSubject, selectedTopic, speak]);

  const startSession = useCallback(async () => {
    setPhase("loading");
    const ctx = getCtx();
    if (ctx?.state === "suspended") await ctx.resume().catch(() => {});
    setElapsed(0);
    segRef.current = 0;
    historyRef.current = [];
    setSegCount(0);
    setCurrentText("");
    setHistory([]);
    sessionOn.current = true;
    setPhase("session");
  }, [getCtx]);

  useEffect(() => {
    if (phase !== "session") return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    if (phase === "session" && segCount === 0 && !running.current) {
      setTimeout(() => doSegment(), 900);
    }
  }, [phase, segCount, doSegment]);

  useEffect(() => {
    if (phase === "session" && timeLeft <= 0) {
      sessionOn.current = false;
      cleanupRef.current?.();
      setPhase("setup");
    }
  }, [phase, timeLeft]);

  useEffect(
    () => () => {
      sessionOn.current = false;
      cleanupRef.current?.();
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    },
    []
  );

  const end = () => {
    sessionOn.current = false;
    cleanupRef.current?.();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setPhase("setup");
  };

  // ── SETUP SCREEN ──────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      <header className="flex items-center px-6 pt-12 pb-4 flex-shrink-0">
        <button onClick={() => navigate({ to: "/more" })} className="text-white/50 hover:text-white mr-4 transition-colors">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">VR Classroom</h1>
          <p className="text-xs text-white/40 mt-0.5">Live AI lecture · Floating bot · Real-time images</p>
        </div>
        <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
          <div className="h-1.5 w-1.5 bg-red-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-red-300 uppercase tracking-widest">Live AI</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Choose a Subject</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {SUBJECTS.map((subj) => (
            <button key={subj.id} onClick={() => { setSelectedSubject(subj); setSelectedTopic(""); }}
              className={`rounded-2xl p-4 text-left transition-all active:scale-[0.97] border ${selectedSubject?.id === subj.id ? `bg-gradient-to-br ${subj.color} border-white/20 shadow-lg` : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.07]"}`}>
              <div className="text-2xl mb-2 leading-none">{subj.icon}</div>
              <div className="text-sm font-semibold">{subj.label}</div>
            </button>
          ))}
        </div>

        {selectedSubject && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Choose a Topic</h2>
            <div className="flex flex-wrap gap-2">
              {selectedSubject.topics.map((topic) => (
                <button key={topic} onClick={() => setSelectedTopic(topic)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95 border ${selectedTopic === topic ? `bg-gradient-to-r ${selectedSubject.color} text-white border-transparent` : "bg-white/[0.06] text-white/70 border-white/[0.06] hover:bg-white/10"}`}>
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTopic && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Session Duration</h2>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button key={d} onClick={() => setDurationMin(d)}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all active:scale-95 ${durationMin === d ? "bg-white text-black" : "bg-white/[0.06] text-white/60 border border-white/[0.06]"}`}>
                  {d}m
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/25 mt-2">Minimum 20 min · Landscape fullscreen · AI voice + images</p>
          </div>
        )}

        {selectedTopic && (
          <div className="mb-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 animate-in fade-in duration-300">
            <h3 className="text-sm font-semibold mb-3">What to Expect</h3>
            {[
              "Floating AI robot moves freely explaining your topic",
              "Robot extends its projector to generate real-time images",
              "Live continuous AI voice narration throughout",
              "Full landscape immersive view — no distractions",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-white/55 mb-2">
                <div className="h-4 w-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}

        {selectedSubject && selectedTopic && (
          <button onClick={startSession} className={`w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] bg-gradient-to-r ${selectedSubject.color} shadow-lg shadow-black/40`}>
            Enter VR Classroom · {durationMin} min
          </button>
        )}
      </div>
    </div>
  );

  // ── LOADING SCREEN ────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 text-white">
      <div className="w-14 h-14 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Entering VR Classroom</h2>
        <p className="text-sm text-white/40">{selectedSubject?.label} · {selectedTopic}</p>
      </div>
      <div className="flex flex-col gap-2">
        {["Waking up AI professor bot", "Preparing image generator", "Switching to landscape"].map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-white/40">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
            {s}
          </div>
        ))}
      </div>
    </div>
  );

  // ── SESSION — LANDSCAPE FULLSCREEN ────────────────────────────────────────
  const pct = Math.min(100, (elapsed / (durationMin * 60)) * 100);
  const projFacing = robotPos.facing === "right" ? "right" : "left";
  const projOffsetX = projFacing === "right" ? 80 : -80;

  return (
    <>
      {/* Force landscape via CSS rotation trick */}
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
      `}</style>

      <div id="vr-root" className="bg-black text-white overflow-hidden" ref={containerRef}>
        {/* Stars background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{
                width: `${0.5 + Math.random() * 1.5}px`,
                height: `${0.5 + Math.random() * 1.5}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: 0.1 + Math.random() * 0.35,
                animation: `pulse ${2 + Math.random() * 4}s infinite`,
                animationDelay: `${Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 z-50">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>

        {/* HUD top */}
        <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-5 pt-4 pb-2" style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.9),transparent)" }}>
          <div className="flex items-center gap-2">
            <button onClick={end} className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center gap-1.5 bg-red-500/25 border border-red-500/35 rounded-full px-2.5 py-1">
              <div className="h-1.5 w-1.5 bg-red-400 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-red-300 uppercase tracking-widest">Live</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-white/90">{selectedSubject?.label} · {selectedTopic}</div>
          </div>
          <div className={`text-sm font-bold font-mono tabular-nums ${timeLeft < 300 ? "text-red-400" : "text-white/80"}`}>
            {fmt(Math.max(0, timeLeft))}
          </div>
        </div>

        {/* ── FLOATING ROBOT ────────────────────────────────────────── */}
        {containerSize.w > 0 && (
          <div
            className="absolute z-30 pointer-events-none"
            style={{
              left: robotPos.x,
              top: robotPos.y + robotPos.bobOffset,
              transform: "translate(-50%, -50%)",
              transition: "left 0.05s linear, top 0.05s linear",
              willChange: "left, top",
            }}
          >
            {/* Projected image — appears in front of robot */}
            {robotPos.projecting && robotPos.imageUrl && (
              <div
                className="absolute z-10"
                style={{
                  [projFacing === "right" ? "left" : "right"]: "84px",
                  top: "-60px",
                  width: "200px",
                  animation: "fadeIn 0.4s ease",
                }}
              >
                {/* Beam line */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 bg-indigo-400/30"
                  style={{
                    [projFacing === "right" ? "right" : "left"]: "100%",
                    width: "28px",
                    height: "2px",
                    background: "linear-gradient(to right, transparent, rgba(165,180,252,0.6))",
                  }}
                />
                {/* Image frame */}
                <div className="rounded-xl overflow-hidden border border-indigo-400/40 shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                  style={{ background: "#0a0a1a" }}>
                  <img
                    src={robotPos.imageUrl}
                    alt="AI generated visual"
                    className="w-full h-auto block"
                    style={{ maxHeight: "130px", objectFit: "cover" }}
                    onLoad={markImageLoaded}
                    onError={markImageLoaded}
                  />
                  {!robotPos.imageLoaded && (
                    <div className="flex items-center justify-center h-20 gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                      <span className="text-[9px] text-indigo-400">Generating…</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Robot SVG */}
            <RobotBot
              facing={robotPos.facing}
              bobOffset={0}
              isSpeaking={isSpeaking}
              projecting={robotPos.projecting}
            />

            {/* Speech bubble */}
            {isSpeaking && currentText && (
              <div
                className="absolute rounded-2xl px-3 py-2 text-[10px] text-white/85 leading-snug pointer-events-none"
                style={{
                  bottom: "78px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "160px",
                  background: "rgba(20,18,50,0.92)",
                  border: "1px solid rgba(99,102,241,0.35)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 0 12px rgba(99,102,241,0.3)",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                {currentText.slice(0, 90)}{currentText.length > 90 ? "…" : ""}
                {/* Tail */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-[-7px] w-3 h-3 rotate-45"
                  style={{ background: "rgba(20,18,50,0.92)", borderRight: "1px solid rgba(99,102,241,0.35)", borderBottom: "1px solid rgba(99,102,241,0.35)" }} />
              </div>
            )}

            {/* Hover ring when speaking */}
            {isSpeaking && (
              <div className="absolute inset-0 rounded-full animate-ping pointer-events-none"
                style={{ background: "rgba(99,102,241,0.15)", borderRadius: "50%", width: "90px", height: "90px", left: "-9px", top: "-9px" }} />
            )}
          </div>
        )}

        {/* Ambient glow that follows the robot */}
        {containerSize.w > 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: robotPos.x - 80,
              top: robotPos.y + robotPos.bobOffset - 80,
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(99,102,241,${isSpeaking ? 0.12 : 0.06}) 0%, transparent 70%)`,
              transition: "left 0.1s linear, top 0.1s linear",
              willChange: "left, top",
            }}
          />
        )}

        {/* Bottom caption bar */}
        <div className="absolute bottom-0 left-0 right-0 z-40 px-6 pb-5 pt-3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 60%, transparent)" }}>
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${isSpeaking ? "bg-indigo-600 shadow-[0_0_14px_rgba(99,102,241,0.7)]" : "bg-white/10"}`}>
              AI
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Professor AI</span>
                {isSpeaking && (
                  <span className="text-[8px] text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 rounded-full px-1.5 py-0.5 font-bold uppercase tracking-wider animate-pulse">Speaking</span>
                )}
              </div>
              {currentText && (
                <p className="text-[10px] text-white/45 truncate mt-0.5">{currentText.slice(0, 100)}{currentText.length > 100 ? "…" : ""}</p>
              )}
            </div>
            {/* Waveform */}
            <div className="flex items-end gap-0.5 h-6">
              {[4, 8, 14, 10, 6, 12, 8, 5, 10, 7].map((h, i) => (
                <div key={i} className={`w-0.5 rounded-full transition-all ${isSpeaking ? "bg-indigo-400" : "bg-white/15"}`}
                  style={{ height: isSpeaking ? `${h}px` : "3px", animationDelay: `${i * 60}ms`, transition: "height 0.3s ease" }} />
              ))}
            </div>
            <button onClick={end} className="h-9 w-9 rounded-full bg-red-600/80 flex items-center justify-center border border-red-500/50 hover:bg-red-600 active:scale-95 transition-all flex-shrink-0">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Fade-in keyframes */}
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) scale(0.9); } to { opacity: 1; transform: translateX(-50%) scale(1); } }
        `}</style>
      </div>
    </>
  );
}
