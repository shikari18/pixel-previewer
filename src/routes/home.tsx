import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Menu,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Flame,
  Home,
  Calendar,
  Library,
  Users,
  MoreHorizontal,
  Circle,
  Play,
  LayoutGrid,
  Pause,
  RotateCcw,
  Sparkles,
  Music,
} from "lucide-react";
import { useState, useEffect } from "react";
import mathIcon from "@/assets/math-icon.png";
import chemIcon from "@/assets/chem-icon.png";
import piIcon from "@/assets/pi-icon.png";

// Persistent global audio variables that survive component unmounts and page transitions
let globalAudio: HTMLAudioElement | null = null;
let globalActiveTrack: string | null = null;

const musicTracks = [
  { name: "Calm Rain", icon: "🌧️", url: "https://www.soundjay.com/nature/sounds/rain-07.mp3" },
  { name: "Sea Waves", icon: "🌊", url: "https://www.soundjay.com/nature/sounds/ocean-wave-1.mp3" },
  { name: "Forest Breeze", icon: "🌲", url: "https://www.soundjay.com/nature/sounds/forest-wind-1.mp3" },
  { name: "White Noise", icon: "🔊", url: "https://www.soundjay.com/misc/sounds/white-noise-1.mp3" },
];

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — The Flow" },
      { name: "description", content: "Your Flow State dashboard." },
    ],
  }),
  component: HomePage,
});

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Circular streak ring component
function StreakRing({ value }: { value: number }) {
  const size = 72;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * 0.7;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#22c55e"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-bold leading-none text-white">{value}</span>
        <span className="text-[10px] text-white/50 mt-0.5">days</span>
      </div>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Focus Music State (initialized from persistent global memory)
  const [activeTrack, setActiveTrack] = useState<string | null>(globalActiveTrack);
  const [showMusicList, setShowMusicList] = useState(false);

  // Tasks State
  const [tasks, setTasks] = useState([
    {
      id: 1,
      icon: mathIcon,
      title: "Math Assignment",
      subtitle: "Due in 2 hours",
      done: true,
    },
    {
      id: 2,
      icon: chemIcon,
      title: "Read: Chapter 4",
      subtitle: "Chemistry",
      done: false,
    },
    {
      id: 3,
      icon: piIcon,
      title: "π Tutor Session",
      subtitle: "3:00 – 4:00 PM",
      done: false,
    },
  ]);

  // Pomodoro Timer State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [timerRunning, timeLeft]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(1500);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const playMusicTrack = (trackName: string, url: string) => {
    if (globalAudio) {
      globalAudio.pause();
    }
    const audio = new Audio(url);
    audio.loop = true;
    audio.play().catch((err) => console.log("Audio play error:", err));
    globalAudio = audio;
    globalActiveTrack = trackName;
    setActiveTrack(trackName);
  };

  const stopMusicTrack = () => {
    if (globalAudio) {
      globalAudio.pause();
      globalAudio = null;
    }
    globalActiveTrack = null;
    setActiveTrack(null);
  };

  // Stats calculation
  const tasksDoneCount = 11 + tasks.filter((t) => t.done).length;

  const stats = [
    {
      value: tasksDoneCount.toString(),
      label: "Tasks Done",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" strokeWidth={2} />,
      iconBg: "bg-emerald-500/10",
    },
    {
      value: "85%",
      label: "Focus Score",
      icon: <TrendingUp className="h-4 w-4 text-violet-400" strokeWidth={2} />,
      iconBg: "bg-violet-500/10",
    },
    {
      value: "7",
      label: "Day Streak",
      icon: <Flame className="h-4 w-4 text-orange-400" strokeWidth={2} />,
      iconBg: "bg-orange-500/10",
    },
  ];

  const weekDays = [
    { label: "M", active: true },
    { label: "T", active: true },
    { label: "W", active: true },
    { label: "T", active: true },
    { label: "F", active: true },
    { label: "S", active: true },
    { label: "S", active: false },
  ];

  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const navItems = [
    { icon: <Home className="h-5 w-5" strokeWidth={1.5} />, label: "Home", active: true, to: "/home" },
    { icon: <Library className="h-5 w-5" strokeWidth={1.5} />, label: "Library", active: false, to: "/library" },
    {
      icon: (
        <svg className="h-5 w-5" strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      ),
      label: "AI Tutor",
      active: false,
      to: "/chat"
    },
    { icon: <Users className="h-5 w-5" strokeWidth={1.5} />, label: "Collab", active: false, to: "/collab" },
  ];

  return (
    <div className="fixed inset-0 bg-[#111111] text-white flex justify-center overflow-hidden page-transition">
      <div className="relative w-full max-w-md h-full flex flex-col">

        {/* Header */}
        {(() => {
          const isScrolled = scrollTop > 20;
          return (
            <div className={`relative flex items-center w-full px-6 pt-4 pb-3 flex-shrink-0 transition-all duration-300 z-10 bg-[#111111] ${isScrolled ? "border-b border-white/5 bg-[#111111]/90 backdrop-blur-md pt-3 pb-2" : ""}`}>
              {/* Left Brand Container (slides/fades out) */}
              <div className={`flex items-center gap-2 transition-all duration-300 ${isScrolled ? "opacity-0 -translate-x-10 pointer-events-none" : "opacity-100 translate-x-0"}`}>
                <svg width="22" height="16" viewBox="0 0 28 20" fill="none" className="text-white">
                  <path d="M1 7 Q7 -1 14 7 T27 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                  <path d="M1 13 Q7 5 14 13 T27 13" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </svg>
                <span className="text-base font-semibold tracking-tight">The Flow</span>
              </div>

              {/* Center Brand Container (slides/fades in - text + SVG centered at top) */}
              <div className={`absolute inset-x-0 bottom-2.5 flex justify-center items-center gap-2 pointer-events-none transition-all duration-300 ${isScrolled ? "opacity-100 translate-y-0 scale-95" : "opacity-0 translate-y-4 scale-90"}`}>
                <svg width="20" height="14" viewBox="0 0 28 20" fill="none" className="text-white">
                  <path d="M1 7 Q7 -1 14 7 T27 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                  <path d="M1 13 Q7 5 14 13 T27 13" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </svg>
                <span className="text-sm font-semibold tracking-tight text-white/90">The Flow</span>
              </div>
            </div>
          );
        })()}

        {/* Scrollable Content Wrapper */}
        <div onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 pb-28">
          {/* Greeting + Avatar */}
          <div className="flex items-start justify-between pt-2 pb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight leading-snug">
                {getGreeting()},<br />Emmanuel 👋
              </h1>
            </div>
            <div className="h-14 w-14 rounded-full border-2 border-white/10 overflow-hidden flex-shrink-0">
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Streak Card */}
          <div className="rounded-2xl bg-white/[0.05] border border-white/8 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-white">Keep the momentum</p>
              <p className="mt-1 text-sm text-white/50">You're on a 7-day streak! 🔥</p>
            </div>
            <StreakRing value={7} />
          </div>

          {/* POMODORO DEEP FOCUS TIMER */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Deep Work Focus</h3>
                <p className="text-xs text-white/40 mt-0.5">Stay locked in for 25 mins</p>
              </div>
              <span className="text-2xl font-mono font-bold tracking-widest text-[#6366f1]">
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="flex-1 rounded-xl bg-white text-black font-semibold py-2.5 text-xs flex items-center justify-center gap-1.5 hover:bg-white/95 transition-colors"
              >
                {timerRunning ? <Pause className="h-3.5 w-3.5" fill="currentColor" /> : <Play className="h-3.5 w-3.5" fill="currentColor" />}
                {timerRunning ? "Pause" : "Start Focus"}
              </button>

              <button
                onClick={() => setShowMusicList(!showMusicList)}
                className={`rounded-xl border px-3 py-2.5 text-xs flex items-center justify-center gap-1.5 transition-colors ${
                  activeTrack
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08]"
                }`}
              >
                <Music className="h-4 w-4" />
                {activeTrack ? activeTrack : "Music"}
              </button>

              <button
                onClick={resetTimer}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-white/70 hover:bg-white/[0.08] transition-colors"
                aria-label="Reset Timer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Focus Music Dropdown Options */}
            {showMusicList && (
              <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.1em] mb-2">
                  Select Ambient Audio
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {musicTracks.map((track) => (
                    <button
                      key={track.name}
                      onClick={() => {
                        if (activeTrack === track.name) {
                          stopMusicTrack();
                        } else {
                          playMusicTrack(track.name, track.url);
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border text-left transition-all ${
                        activeTrack === track.name
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-medium"
                          : "border-white/5 bg-white/[0.01] text-white/60 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="text-base">{track.icon}</span>
                      <span className="truncate">{track.name}</span>
                    </button>
                  ))}
                </div>
                {activeTrack && (
                  <button
                    onClick={stopMusicTrack}
                    className="w-full mt-2 rounded-xl bg-red-500/10 border border-red-500/20 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/15 transition-colors"
                  >
                    Stop Focus Music
                  </button>
                )}
              </div>
            )}
          </div>

          {/* WEEKLY COMPLETION STRIP */}
          <div className="mt-6 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">Weekly Progress</span>
              <span className="text-[10px] text-emerald-400">92% Met</span>
            </div>
            <div className="flex justify-between">
              {weekDays.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-white/30 font-semibold">{d.label}</span>
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                      d.active
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        : "bg-white/[0.02] border-white/5 text-white/30"
                    }`}
                  >
                    {d.active ? "✓" : idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Plan */}
          <div className="mt-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Today's Plan</h2>
              <button className="flex items-center gap-0.5 text-sm text-white/50 hover:text-white transition-colors">
                View all <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="rounded-2xl bg-white/[0.04] border border-white/8 divide-y divide-white/[0.06] overflow-hidden">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={task.icon} className="h-full w-full object-cover" alt={task.title} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${task.done ? "text-white/40 line-through" : "text-white"}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">{task.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {task.done ? (
                      <CheckCircle2 className="h-5 w-5 text-amber-400" strokeWidth={1.5} />
                    ) : (
                      <Circle className="h-5 w-5 text-white/20" strokeWidth={1.5} />
                    )}
                    <ChevronRight className="h-4 w-4 text-white/20" strokeWidth={2} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI TUTOR QUICK HELP PORTAL */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 p-5 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Ask Mr. Simon
              </h3>
              <p className="text-xs text-white/50">Stuck? Get instant AI tutor support</p>
            </div>
            <Link
              to="/customer-chat"
              className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2.5 text-xs font-semibold text-white transition-colors"
            >
              Chat Support
            </Link>
          </div>

          {/* Study Stats */}
          <div className="mt-7">
            <h2 className="text-lg font-semibold mb-4">Study Stats</h2>
            <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-4 grid grid-cols-3 divide-x divide-white/[0.06]">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-2 px-2">
                  <span className="text-2xl font-bold text-white">{s.value}</span>
                  <span className="text-xs text-white/40 text-center">{s.label}</span>
                  <div className={`h-7 w-7 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                    {s.icon}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pinned Bottom Nav */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#111111]/95 backdrop-blur-md border-t border-x border-white/[0.06] rounded-t-[20px] px-2 pb-6 pt-3 flex items-center justify-around z-50">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center gap-1.5 px-3 ${
                item.active ? "text-white" : "text-white/35"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.active && <div className="h-0.5 w-4 bg-white rounded-full -mt-0.5" />}
            </Link>
          ))}
          <Link
            to="/more"
            className="flex flex-col items-center gap-1.5 px-3 text-white/35 hover:text-white/60 transition-colors"
          >
            <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">More</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
