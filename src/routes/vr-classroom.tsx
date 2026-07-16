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
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
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
  return { cleanup: () => { active = false; if (source) { try { source.stop(); } catch(e){} } } };
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

const MOCK_STUDENTS = [
  { name: "Professor AI",  role: "professor", hand: false },
  { name: "Ama Owusu",     role: "student",   hand: false },
  { name: "Kwame Asante",  role: "student",   hand: false },
  { name: "Abena Mensah",  role: "student",   hand: true  },
  { name: "Kofi Boateng",  role: "student",   hand: false },
  { name: "Efua Darko",    role: "student",   hand: false },
  { name: "Nana Addo",     role: "student",   hand: false },
  { name: "Yaa Asantewaa", role: "student",   hand: false },
];

async function getNextLesson(subject: string, topic: string, history: {role:string;content:string}[]): Promise<string> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: `You are Professor AI, a brilliant engaging university lecturer teaching ${subject} on the topic of ${topic}. You are mid-lecture in a live virtual classroom. Keep each segment to 3-4 sentences. Move progressively. Be vivid, use real-world analogies. Do NOT use markdown or bullets.` },
          ...history,
          { role: "user", content: "Continue the lecture." },
        ],
        max_tokens: 160, temperature: 0.75,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "Let us continue exploring this fascinating topic...";
  } catch { return "Let us continue exploring this fascinating topic..."; }
}

async function getChalkboard(subject: string, topic: string, seg: number): Promise<string[]> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: `Generate 4-5 concise chalkboard notes for a ${subject} lecture on "${topic}" (segment ${seg}). Return ONLY a valid JSON array of short strings under 60 chars each. Mix equations, key terms, short phrases.` }],
        max_tokens: 180, temperature: 0.5,
      }),
    });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "[]";
    const match = raw.match(/\[[\s\S]*?\]/);
    const parsed = match ? JSON.parse(match[0]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch { return [`${topic} — Core Concepts`, "Key Principles & Definitions", "Real-World Applications"]; }
}

function VrClassroomPage() {
  const navigate = useNavigate();
  const generateSpeech = useServerFn(generateSpeechFn);

  const [phase, setPhase] = useState<"setup"|"loading"|"session">("setup");
  const [selectedSubject, setSelectedSubject] = useState<typeof SUBJECTS[0]|null>(null);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [durationMin, setDurationMin] = useState(30);

  const [elapsed, setElapsed] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [chalkLines, setChalkLines] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<{name:string;text:string;time:string}[]>([
    { name: "Ama Owusu", text: "Excited for today's class!", time: "now" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [studentCount] = useState(38 + Math.floor(Math.random() * 12));
  const [showChat, setShowChat] = useState(true);
  const [showPeople, setShowPeople] = useState(true);
  const [segCount, setSegCount] = useState(0);
  const [history, setHistory] = useState<{role:string;content:string}[]>([]);
  const [handRaised, setHandRaised] = useState(false);

  const audioCtxRef    = useRef<AudioContext|null>(null);
  const cleanupRef     = useRef<(()=>void)|null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval>|null>(null);
  const running        = useRef(false);
  const sessionOn      = useRef(false);

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) audioCtxRef.current = new AC();
    }
    return audioCtxRef.current;
  }, []);

  const fmt = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };

  const timeLeft = durationMin * 60 - elapsed;

  const speak = useCallback(async (text: string, onDone: () => void) => {
    cleanupRef.current?.();
    const ctx = getCtx();
    if (!ctx) { onDone(); return; }
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});
    try {
      const b64 = await generateSpeech({ data: text, voiceId: PROFESSOR_VOICE_ID });
      const { cleanup } = playBase64Audio(ctx, b64, onDone, () => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 0.92; u.onend = onDone;
          window.speechSynthesis.speak(u);
        } else onDone();
      });
      cleanupRef.current = cleanup;
    } catch { onDone(); }
  }, [generateSpeech, getCtx]);

  const doSegment = useCallback(async (currentHistory: {role:string;content:string}[], currentSeg: number) => {
    if (running.current || !sessionOn.current) return;
    running.current = true;
    const subj = selectedSubject?.label || "General Studies";

    const [text, newChalk] = await Promise.all([
      getNextLesson(subj, selectedTopic, currentHistory),
      currentSeg % 2 === 0 ? getChalkboard(subj, selectedTopic, currentSeg + 1) : Promise.resolve([]),
    ]);

    if (!sessionOn.current) { running.current = false; return; }

    setCurrentText(text);
    if (newChalk.length > 0) setChalkLines(newChalk);
    setIsSpeaking(true);

    // Occasional student chat
    if (currentSeg > 0 && currentSeg % 3 === 0) {
      const s = MOCK_STUDENTS[1 + (currentSeg % (MOCK_STUDENTS.length - 1))];
      const qs = ["That makes sense, thank you!", "Could you clarify that?", "What are the practical uses?", "Great explanation!", "Is this on the exam?"];
      const now = new Date();
      setChatMessages(m => [...m.slice(-20), { name: s.name, text: qs[currentSeg % qs.length], time: `${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}` }]);
    }

    speak(text, () => {
      if (!sessionOn.current) return;
      setIsSpeaking(false);
      const newHistory = [...currentHistory, { role: "assistant", content: text }];
      setHistory(newHistory);
      const nextSeg = currentSeg + 1;
      setSegCount(nextSeg);
      running.current = false;
      setTimeout(() => { if (sessionOn.current) doSegment(newHistory, nextSeg); }, 2200);
    });
  }, [selectedSubject, selectedTopic, speak]);

  const startSession = useCallback(async () => {
    setPhase("loading");
    const ctx = getCtx();
    if (ctx?.state === "suspended") await ctx.resume().catch(() => {});
    const subj = selectedSubject?.label || "General Studies";
    const initialChalk = await getChalkboard(subj, selectedTopic, 1);
    setChalkLines(initialChalk);
    setElapsed(0); setSegCount(0); setHistory([]); setCurrentText("");
    sessionOn.current = true;
    setPhase("session");
  }, [selectedSubject, selectedTopic, getCtx]);

  useEffect(() => {
    if (phase !== "session") return;
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    if (phase === "session" && segCount === 0 && !running.current) {
      setTimeout(() => doSegment([], 0), 800);
    }
  }, [phase, segCount, doSegment]);

  useEffect(() => {
    if (phase === "session" && timeLeft <= 0) { sessionOn.current = false; cleanupRef.current?.(); setPhase("setup"); }
  }, [phase, timeLeft]);

  useEffect(() => () => {
    sessionOn.current = false;
    cleanupRef.current?.();
    if (timerRef.current) clearInterval(timerRef.current);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const now = new Date();
    setChatMessages(m => [...m.slice(-20), { name: "You", text: chatInput.trim(), time: `${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}` }]);
    setChatInput("");
  };

  const end = () => { sessionOn.current = false; cleanupRef.current?.(); if (typeof window !== "undefined") window.speechSynthesis?.cancel(); setPhase("setup"); };

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      <header className="flex items-center px-6 pt-12 pb-4 flex-shrink-0">
        <button onClick={() => navigate({ to: "/more" })} className="text-white/50 hover:text-white mr-4 transition-colors">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">VR Classroom</h1>
          <p className="text-xs text-white/40 mt-0.5">Live AI lecture · Real-time voice teaching</p>
        </div>
        <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
          <div className="h-1.5 w-1.5 bg-red-400 rounded-full animate-pulse"/>
          <span className="text-[10px] font-bold text-red-300 uppercase tracking-widest">Live AI</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Choose a Subject</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {SUBJECTS.map(subj => (
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
              {selectedSubject.topics.map(topic => (
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
              {DURATION_OPTIONS.map(d => (
                <button key={d} onClick={() => setDurationMin(d)}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all active:scale-95 ${durationMin === d ? "bg-white text-black" : "bg-white/[0.06] text-white/60 border border-white/[0.06]"}`}>
                  {d}m
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/25 mt-2">Minimum 20 min · Professor AI teaches continuously</p>
          </div>
        )}

        {selectedTopic && (
          <div className="mb-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 animate-in fade-in duration-300">
            <h3 className="text-sm font-semibold mb-3">What to Expect</h3>
            {["Live continuous voice lecture from Professor AI","Chalkboard updates with key concepts & equations","Interactive class chat with virtual classmates","Raise hand, type questions, leave anytime"].map((s,i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-white/55 mb-2">
                <div className="h-4 w-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                </div>
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}

        {selectedSubject && selectedTopic && (
          <button onClick={startSession} className={`w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] bg-gradient-to-r ${selectedSubject.color} shadow-lg shadow-black/40`}>
            Enter Classroom · {durationMin} min
          </button>
        )}
      </div>
    </div>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 text-white">
      <div className="w-14 h-14 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin"/>
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Preparing Your Classroom</h2>
        <p className="text-sm text-white/40">{selectedSubject?.label} · {selectedTopic}</p>
      </div>
      <div className="flex flex-col gap-2">
        {["Connecting to Professor AI","Loading lecture content","Setting up classroom"].map((s,i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-white/40">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" style={{animationDelay:`${i*200}ms`}}/>
            {s}
          </div>
        ))}
      </div>
    </div>
  );

  // ── SESSION ────────────────────────────────────────────────────────────────
  const pct = Math.min(100, (elapsed / (durationMin * 60)) * 100);

  return (
    <div className="fixed inset-0 text-white overflow-hidden" style={{background:"linear-gradient(160deg,#060812 0%,#0a0d1a 50%,#080b18 100%)"}}>
      <div className={`absolute inset-x-0 -top-20 h-64 bg-gradient-to-b ${selectedSubject?.color || "from-indigo-600 to-violet-700"} opacity-8 blur-3xl pointer-events-none`}/>
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/8 z-50">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000" style={{width:`${pct}%`}}/>
      </div>

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-11 pb-3" style={{background:"linear-gradient(to bottom,rgba(0,0,0,0.85),transparent)"}}>
        <div className="flex items-center gap-2">
          <button onClick={end} className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex items-center gap-1.5 bg-red-500/25 border border-red-500/35 rounded-full px-2.5 py-1">
            <div className="h-1.5 w-1.5 bg-red-400 rounded-full animate-pulse"/>
            <span className="text-[9px] font-bold text-red-300 uppercase tracking-widest">Live</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold text-white/90">{selectedSubject?.label} · {selectedTopic}</div>
          <div className="text-[9px] text-white/35 mt-0.5">{studentCount} students</div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-bold font-mono tabular-nums ${timeLeft < 300 ? "text-red-400" : "text-white/90"}`}>{fmt(Math.max(0, timeLeft))}</div>
          <div className="text-[9px] text-white/35">left</div>
        </div>
      </div>

      {/* Chalkboard */}
      <div className="absolute inset-0 flex items-center justify-center" style={{paddingTop:"108px",paddingBottom:"168px"}}>
        <div className="w-full mx-4 rounded-3xl overflow-hidden relative" style={{background:"linear-gradient(145deg,#0f1f12 0%,#0a1610 60%,#08120d 100%)",border:"1.5px solid rgba(255,255,255,0.05)",boxShadow:"0 0 80px rgba(0,0,0,0.9),inset 0 0 60px rgba(0,0,0,0.6)",minHeight:"220px"}}>
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{backgroundImage:"radial-gradient(circle, white 1px, transparent 1px)",backgroundSize:"16px 16px"}}/>
          <div className="relative p-6 pt-5">
            <div className="text-center mb-5">
              <h3 className="text-lg font-light tracking-widest" style={{fontFamily:"Georgia,serif",color:"rgba(235,225,200,0.85)",textShadow:"0 0 10px rgba(235,225,200,0.15)"}}>{selectedTopic}</h3>
              <div className="h-px w-12 mx-auto mt-2" style={{background:"rgba(235,225,200,0.2)"}}/>
            </div>
            <div className="space-y-3">
              {chalkLines.map((line, i) => (
                <div key={`${segCount}-${i}`} className="flex items-start gap-3 animate-in fade-in duration-700" style={{animationDelay:`${i*120}ms`}}>
                  <span style={{color:"rgba(160,210,160,0.4)",fontSize:"9px",marginTop:"4px",flexShrink:0}}>{i===0?"▶":"·"}</span>
                  <p className="text-sm leading-relaxed" style={{fontFamily:"Georgia,serif",color:`rgba(235,225,200,${0.85-i*0.07})`,textShadow:"0 0 5px rgba(235,225,200,0.1)"}}>{line}</p>
                </div>
              ))}
            </div>
          </div>
          {isSpeaking && (
            <div className="absolute bottom-3 right-4 flex items-end gap-0.5">
              {[5,9,14,9,5,12,7].map((h,i) => (
                <div key={i} className="w-0.5 bg-emerald-400/60 rounded-full animate-bounce" style={{height:`${h}px`,animationDelay:`${i*80}ms`,animationDuration:"700ms"}}/>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Participants */}
      {showPeople && (
        <div className="absolute left-2 top-28 z-30 w-40 rounded-2xl overflow-hidden" style={{background:"rgba(8,10,22,0.88)",backdropFilter:"blur(24px)",border:"1px solid rgba(255,255,255,0.06)"}}>
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.05]">
            <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Participants</span>
            <button onClick={() => setShowPeople(false)} className="text-white/25 hover:text-white/50">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="p-2 space-y-0.5 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden">
            {MOCK_STUDENTS.map((s, i) => (
              <div key={i} className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${s.role==="professor"&&isSpeaking?"bg-emerald-500/10":"hover:bg-white/[0.04]"}`}>
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 ${s.role==="professor"?"bg-indigo-600":"bg-white/10"}`}>{s.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-medium text-white/75 truncate">{s.name}</div>
                  {s.role==="professor"&&isSpeaking&&<div className="text-[7px] text-emerald-400 font-bold">Speaking</div>}
                </div>
                {s.hand&&<span className="text-[9px]">✋</span>}
              </div>
            ))}
            <div className="text-[8px] text-white/20 text-center py-1">+{studentCount-MOCK_STUDENTS.length} more</div>
          </div>
        </div>
      )}

      {/* Chat */}
      {showChat && (
        <div className="absolute right-2 top-28 z-30 w-44 rounded-2xl overflow-hidden flex flex-col" style={{background:"rgba(8,10,22,0.88)",backdropFilter:"blur(24px)",border:"1px solid rgba(255,255,255,0.06)",maxHeight:"320px"}}>
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.05] flex-shrink-0">
            <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Live Chat</span>
            <button onClick={() => setShowChat(false)} className="text-white/25 hover:text-white/50">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 [&::-webkit-scrollbar]:hidden">
            {chatMessages.map((msg, i) => (
              <div key={i}>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className={`text-[9px] font-bold ${msg.name==="You"?"text-indigo-400":"text-white/60"}`}>{msg.name}</span>
                  <span className="text-[8px] text-white/20">{msg.time}</span>
                </div>
                <p className="text-[10px] text-white/55 leading-snug">{msg.text}</p>
              </div>
            ))}
          </div>
          <div className="flex-shrink-0 border-t border-white/[0.05] flex items-center gap-1.5 px-2.5 py-2">
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Type a message..." className="flex-1 bg-transparent text-[10px] text-white placeholder-white/20 outline-none min-w-0"/>
            <button onClick={sendChat} className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 hover:bg-indigo-500">
              <svg className="h-2.5 w-2.5 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Professor status */}
      <div className="absolute z-30 left-0 right-0 px-4" style={{bottom:"100px"}}>
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${isSpeaking?"bg-emerald-500/25 border-2 border-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.5)]":"bg-white/8 border border-white/15"}`}>P</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Professor AI</span>
              {isSpeaking&&<span className="text-[8px] text-emerald-400 bg-emerald-500/12 border border-emerald-500/25 rounded-full px-1.5 py-0.5 font-bold uppercase tracking-wider animate-pulse">Speaking</span>}
            </div>
            {currentText&&<p className="text-[10px] text-white/45 truncate mt-0.5">{currentText.slice(0,80)}{currentText.length>80?"...":""}</p>}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-9 pt-4 flex items-center justify-around" style={{background:"linear-gradient(to top,rgba(0,0,0,0.96) 60%,transparent)"}}>
        <button onClick={()=>setShowPeople(p=>!p)} className={`flex flex-col items-center gap-1 transition-colors ${showPeople?"text-white":"text-white/35"}`}>
          <div className="h-10 w-10 rounded-full bg-white/8 flex items-center justify-center border border-white/8">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <span className="text-[9px]">People</span>
        </button>

        <button onClick={()=>{setHandRaised(h=>!h);const now=new Date();setChatMessages(m=>[...m.slice(-20),{name:"You",text:handRaised?"Lowered hand":"✋ Raised hand",time:`${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}`}]);}} className={`flex flex-col items-center gap-1 ${handRaised?"text-amber-400":"text-white/35"}`}>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xl border ${handRaised?"bg-amber-500/20 border-amber-500/40":"bg-white/8 border-white/8"}`}>✋</div>
          <span className="text-[9px]">{handRaised?"Hand up":"Hand"}</span>
        </button>

        <button onClick={end} className="flex flex-col items-center gap-1">
          <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_24px_rgba(239,68,68,0.5)] border border-red-500/50">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </div>
          <span className="text-[9px] text-red-400">Leave</span>
        </button>

        <button onClick={()=>setShowChat(c=>!c)} className={`flex flex-col items-center gap-1 transition-colors ${showChat?"text-white":"text-white/35"}`}>
          <div className="h-10 w-10 rounded-full bg-white/8 flex items-center justify-center border border-white/8 relative">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            {chatMessages.length>0&&<div className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-indigo-500 rounded-full text-[7px] flex items-center justify-center font-bold">{Math.min(chatMessages.length,9)}</div>}
          </div>
          <span className="text-[9px]">Chat</span>
        </button>

        <div className="flex flex-col items-center gap-1 text-white/35">
          <div className="h-10 w-10 rounded-full bg-white/[0.04] flex items-center justify-center border border-white/[0.06]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <span className="text-[9px] font-mono">{fmt(elapsed)}</span>
        </div>
      </div>
    </div>
  );
}
