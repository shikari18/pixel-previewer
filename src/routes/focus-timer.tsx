import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Home,
  Users,
  LayoutGrid,
  ChevronRight,
  Clock,
  CheckCircle,
  Plus,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/focus-timer")({
  head: () => ({
    meta: [
      { title: "Focus Timer — The Flow" },
      { name: "description", content: "Keep your focus with custom Pomodoro timers." },
    ],
  }),
  component: FocusTimerPage,
});

interface Session {
  id: string;
  name: string;
  timeRange: string;
  duration: number; // in minutes
}

function AiTutorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function FocusTimerPage() {
  const navigate = useNavigate();

  // Presets & Active mode
  const modes = [
    { id: "focus", label: "Focus", duration: 50, color: "from-[#6366f1] to-[#818cf8]" },
    { id: "short", label: "Short Break", duration: 10, color: "from-emerald-500 to-emerald-400" },
    { id: "long", label: "Long Break", duration: 20, color: "from-blue-500 to-blue-400" },
    { id: "custom", label: "Custom Edit", duration: 25, color: "from-purple-500 to-purple-400" },
  ];

  const [activeModeId, setActiveModeId] = useState("focus");
  const [customMinutes, setCustomMinutes] = useState(25);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(50 * 60); // in seconds
  const [duration, setDuration] = useState(50 * 60); // total starting seconds
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Stats state (persisted)
  const [sessionsCompleted, setSessionsCompleted] = useState(3);
  const [sessionsGoal, setSessionsGoal] = useState(4);
  const [focusTimeMinutes, setFocusTimeMinutes] = useState(135); // 2h 15m
  const [recentSessions, setRecentSessions] = useState<Session[]>([
    { id: "1", name: "Physics Revision", timeRange: "9:00 AM - 9:50 AM", duration: 50 },
    { id: "2", name: "Math Problems", timeRange: "11:15 AM - 12:05 PM", duration: 50 },
    { id: "3", name: "Chemistry Notes", timeRange: "2:00 PM - 2:50 PM", duration: 50 },
  ]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("flow_focus_timer_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessionsCompleted(parsed.sessionsCompleted);
        setSessionsGoal(parsed.sessionsGoal);
        setFocusTimeMinutes(parsed.focusTimeMinutes);
        setRecentSessions(parsed.recentSessions);
      } catch (e) {}
    }
  }, []);

  const saveStats = (completed: number, goal: number, fTime: number, recents: Session[]) => {
    localStorage.setItem(
      "flow_focus_timer_data",
      JSON.stringify({
        sessionsCompleted: completed,
        sessionsGoal: goal,
        focusTimeMinutes: fTime,
        recentSessions: recents,
      })
    );
  };

  // Set time when mode changes
  const selectMode = (modeId: string) => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    setActiveModeId(modeId);

    if (modeId === "custom") {
      setShowCustomModal(true);
    } else {
      const mode = modes.find((m) => m.id === modeId);
      if (mode) {
        setTimeLeft(mode.duration * 60);
        setDuration(mode.duration * 60);
      }
    }
  };

  // Apply custom minutes
  const handleApplyCustomMinutes = (mins: number) => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    setCustomMinutes(mins);
    setTimeLeft(mins * 60);
    setDuration(mins * 60);
    setShowCustomModal(false);
  };

  // Play audio chime
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Simple double beep/chime
      const playTone = (time: number, freq: number, dur: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        
        osc.start(time);
        osc.stop(time + dur);
      };
      
      const now = audioCtx.currentTime;
      playTone(now, 523.25, 0.4); // C5
      playTone(now + 0.15, 659.25, 0.5); // E5
      playTone(now + 0.3, 783.99, 0.6); // G5
    } catch (e) {
      console.warn("Could not play timer chime:", e);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Completed!
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            playChime();
            
            // Log session and update stats
            const mins = Math.round(duration / 60);
            const activeMode = modes.find((m) => m.id === activeModeId);
            const labelName = activeMode?.id === "focus" 
              ? "Focus Session" 
              : activeMode?.id === "custom" 
              ? "Custom Session" 
              : "Break Session";

            // Format time range
            const now = new Date();
            const start = new Date(now.getTime() - duration * 1000);
            const formatTime = (d: Date) => {
              let hours = d.getHours();
              const minutes = d.getMinutes().toString().padStart(2, "0");
              const ampm = hours >= 12 ? "PM" : "AM";
              hours = hours % 12 || 12;
              return `${hours}:${minutes} ${ampm}`;
            };
            const timeRange = `${formatTime(start)} - ${formatTime(now)}`;

            const newSession: Session = {
              id: Date.now().toString(),
              name: labelName,
              timeRange,
              duration: mins,
            };

            const updatedRecents = [newSession, ...recentSessions].slice(0, 10);
            const newCompleted = sessionsCompleted + 1;
            const newFocusTime = focusTimeMinutes + (activeModeId === "focus" || activeModeId === "custom" ? mins : 0);

            setSessionsCompleted(newCompleted);
            setFocusTimeMinutes(newFocusTime);
            setRecentSessions(updatedRecents);
            saveStats(newCompleted, sessionsGoal, newFocusTime, updatedRecents);

            alert(`Great job! Your ${labelName} is complete.`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, duration, activeModeId]);

  // Reset Timer
  const handleReset = () => {
    setIsRunning(false);
    const activeMode = modes.find((m) => m.id === activeModeId);
    if (activeModeId === "custom") {
      setTimeLeft(customMinutes * 60);
    } else if (activeMode) {
      setTimeLeft(activeMode.duration * 60);
    }
  };

  // Format MM:SS
  const formatTimeStr = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Circular progress calculations
  const radius = 100;
  const stroke = 6;
  const circ = 2 * Math.PI * radius;
  const pct = timeLeft / duration;
  const offset = circ - pct * circ;

  // Stats formatting
  const focusHoursStr = `${Math.floor(focusTimeMinutes / 60)}h ${focusTimeMinutes % 60}m`;
  const dailyPercent = Math.min(100, Math.round((sessionsCompleted / sessionsGoal) * 100));

  // Bottom Navigation
  const navItems = [
    { icon: <Home className="h-5 w-5" strokeWidth={1.5} />, label: "Home", to: "/home" },
    { icon: <svg className="h-5 w-5" strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>, label: "Library", to: "/library" },
    { icon: <AiTutorIcon className="h-5 w-5" />, label: "AI Tutor", to: "/chat" },
    { icon: <Users className="h-5 w-5" strokeWidth={1.5} />, label: "Collab", to: "/collab" },
    { icon: <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />, label: "More", to: "/more", active: true },
  ];

  return (
    <div className="fixed inset-0 bg-black text-white flex overflow-hidden page-transition">
      <div className="relative w-full h-full flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 bg-black">
          <div className="flex items-center">
            <button
              onClick={() => navigate({ to: "/more" })}
              className="text-white/60 hover:text-white mr-4 transition-colors p-1"
              aria-label="Back"
            >
              <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Focus Timer</h1>
          </div>
          <button onClick={() => alert("Timer Settings coming soon!")} className="text-white/60 hover:text-white p-1 transition-colors">
            <Settings className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* Circular Countdown Timer */}
          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
              <svg width={240} height={240} className="-rotate-90">
                {/* Track circle */}
                <circle
                  cx={120}
                  cy={120}
                  r={radius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth={stroke}
                />
                {/* Animated progress circle */}
                <circle
                  cx={120}
                  cy={120}
                  r={radius}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth={stroke}
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-100"
                />
              </svg>
              {/* Inner content */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold mb-1">
                  {modes.find((m) => m.id === activeModeId)?.label || "Focus"}
                </span>
                <span className="text-5xl font-bold tracking-tighter tabular-nums font-mono leading-none">
                  {formatTimeStr(timeLeft)}
                </span>
                <span className="text-[10px] text-white/40 mt-3 max-w-[120px] leading-tight">
                  {isRunning ? "Stay focused!" : "Stay focused and get things done."}
                </span>
              </div>
            </div>

            {/* Play / Pause / Reset Control Row */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handleReset}
                className="h-10 w-10 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-white transition-colors active:scale-95"
                title="Reset timer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98]"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4 fill-white" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" strokeWidth={1} />
                    <span>Start</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mode Selection Grid */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {modes.map((mode) => {
              const isActive = activeModeId === mode.id;
              let iconElement;
              
              if (mode.id === "focus") {
                iconElement = (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                  </svg>
                );
              } else if (mode.id === "short") {
                iconElement = (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <path d="M17 8h1a4 4 0 110 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                    <line x1="6" y1="2" x2="6" y2="4" />
                    <line x1="10" y1="2" x2="10" y2="4" />
                    <line x1="14" y1="2" x2="14" y2="4" />
                  </svg>
                );
              } else if (mode.id === "long") {
                iconElement = (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <path d="M17 8h1a4 4 0 110 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                    <line x1="6" y1="2" x2="6" y2="4" />
                    <line x1="10" y1="2" x2="10" y2="4" />
                    <line x1="14" y1="2" x2="14" y2="4" />
                  </svg>
                );
              } else {
                iconElement = (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" />
                  </svg>
                );
              }

              return (
                <button
                  key={mode.id}
                  onClick={() => selectMode(mode.id)}
                  className={`rounded-2xl border p-3 flex flex-col items-center justify-between text-center gap-1.5 transition-all ${
                    isActive
                      ? "bg-indigo-600/10 border-indigo-500/40 text-white"
                      : "bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-white/[0.04] text-white/40"}`}>
                    {iconElement}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold leading-tight">{mode.label}</span>
                    <span className="text-[9px] opacity-55 mt-0.5">
                      {mode.id === "custom" ? `${customMinutes} min` : `${mode.duration} min`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Daily Stats Summary Card */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 mb-8">
            <div className="flex items-center justify-between gap-5">
              <div className="flex-1 grid grid-cols-2 gap-4 divide-x divide-white/[0.06]">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Sessions</span>
                  <span className="text-xl font-bold text-white leading-tight">
                    {sessionsCompleted} / {sessionsGoal}
                  </span>
                  <span className="text-[9px] text-white/35 mt-0.5">Daily Goal</span>
                </div>
                <div className="flex flex-col gap-1 pl-4">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Focus Time</span>
                  <span className="text-xl font-bold text-indigo-400 leading-tight">
                    {focusHoursStr}
                  </span>
                  <span className="text-[9px] text-white/35 mt-0.5">Completed Today</span>
                </div>
              </div>

              {/* Progress Circle (75%) */}
              <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 64, height: 64 }}>
                <svg width={64} height={64} className="-rotate-90">
                  <circle cx={32} cy={32} r={26} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth={4} />
                  <circle
                    cx={32}
                    cy={32}
                    r={26}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth={4}
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 - (dailyPercent / 100) * (2 * Math.PI * 26)}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute text-xs font-bold text-white">{dailyPercent}%</div>
              </div>
            </div>
          </div>

          {/* Recent Sessions List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white/40 uppercase tracking-wider text-[11px]">Recent Sessions</p>
              <button onClick={() => alert("History view coming soon!")} className="text-xs text-indigo-400 hover:underline">View All</button>
            </div>
            
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl bg-white/[0.04] border border-white/5 p-4 flex items-center justify-between hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <CheckCircle className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{session.name}</p>
                      <p className="text-xs text-white/40 mt-1">{session.timeRange}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white/60">{session.duration} min</span>
                    <ChevronRight className="h-4 w-4 text-white/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Pinned Bottom Nav */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-white/[0.06] px-2 pb-6 pt-3 flex items-center justify-around z-40">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center gap-1.5 px-3 ${
                item.active ? "text-white" : "text-white/35 hover:text-white/60"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.active && <div className="h-0.5 w-4 bg-white rounded-full -mt-0.5" />}
            </Link>
          ))}
        </div>

        {/* Custom Edit Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Custom Duration</h3>
                <button onClick={() => setShowCustomModal(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Minutes</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    defaultValue={customMinutes}
                    id="custom-mins-input"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 text-sm font-mono"
                  />
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setShowCustomModal(false)}
                    className="flex-1 py-3 border border-white/10 rounded-xl text-white/70 hover:bg-white/[0.04] active:scale-[0.98] transition-all text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const val = Number((document.getElementById("custom-mins-input") as HTMLInputElement)?.value || 25);
                      handleApplyCustomMinutes(val);
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all text-white rounded-xl text-sm font-bold"
                  >
                    Apply Timer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
