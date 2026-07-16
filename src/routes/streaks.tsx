import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Home, Users, LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/streaks")({
  head: () => ({ meta: [{ title: "Streaks — The Flow" }] }),
  component: StreaksPage,
});

function AiTutorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

// Mini calendar for streak visualization
function StreakCalendar() {
  const month = "May 2024";
  const days = [
    // week 1
    { d: 29, prev: true, streak: false }, { d: 30, prev: true, streak: false },
    { d: 1, streak: true }, { d: 2, streak: true }, { d: 3, streak: true },
    { d: 4, streak: true }, { d: 5, streak: true },
    // week 2
    { d: 6, streak: false }, { d: 7, streak: false },
    { d: 8, streak: true }, { d: 9, streak: true }, { d: 10, streak: true },
    { d: 11, streak: true }, { d: 12, streak: true },
    // week 3
    { d: 13, streak: true }, { d: 14, streak: true },
    { d: 15, streak: true }, { d: 16, streak: true }, { d: 17, streak: true },
    { d: 18, streak: true }, { d: 19, streak: true },
    // week 4
    { d: 20, streak: true }, { d: 21, streak: true },
    { d: 22, today: true }, { d: 23, streak: false }, { d: 24, streak: false },
    { d: 25, streak: false }, { d: 26, streak: false },
    // week 5
    { d: 27, streak: false }, { d: 28, streak: false },
    { d: 29, streak: false }, { d: 30, streak: false }, { d: 31, streak: false },
    { d: 1, next: true }, { d: 2, next: true },
  ];

  const headers = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-white">{month}</p>
        <div className="flex items-center gap-3">
          <button className="text-white/30 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button className="text-white/30 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {headers.map(h => (
          <div key={h} className="text-center text-[10px] font-semibold text-white/30 uppercase">{h}</div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, i) => (
          <div key={i} className="flex items-center justify-center py-0.5">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              day.today
                ? "bg-white/20 text-white border border-white/30"
                : day.streak && !day.prev && !day.next
                ? "border border-orange-500/60 text-orange-400"
                : day.prev || day.next
                ? "text-white/15"
                : "text-white/40"
            }`}>
              {day.d}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StreaksPage() {
  const navigate = useNavigate();

  const milestones = [
    { days: 7, label: "Locked in", done: true, current: 7, total: 7 },
    { days: 14, label: "Keep going!", done: false, current: 7, total: 14 },
    { days: 30, label: "Consistency Champion", done: false, current: 7, total: 30 },
    { days: 60, label: "Flow Master", done: false, current: 7, total: 60 },
    { days: 100, label: "The Flow Legend", done: false, current: 7, total: 100 },
  ];

  const navItems = [
    { icon: <Home className="h-5 w-5" strokeWidth={1.5} />, label: "Home", to: "/home" },
    { icon: <svg className="h-5 w-5" strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>, label: "Library", to: "/library" },
    { icon: <AiTutorIcon className="h-5 w-5" />, label: "AI Tutor", to: "/chat" },
    { icon: <Users className="h-5 w-5" strokeWidth={1.5} />, label: "Collab", to: "/collab" },
    { icon: <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />, label: "More", to: "/more" },
  ];

  return (
    <div className="fixed inset-0 bg-black text-white flex overflow-hidden page-transition">
      <div className="relative w-full h-full flex flex-col">

        {/* Header */}
        <header className="flex items-center px-5 pt-14 pb-4 flex-shrink-0">
          <button onClick={() => navigate({ to: "/more" })} className="text-white/60 hover:text-white mr-4 transition-colors">
            <ArrowLeft className="h-6 w-6" strokeWidth={1.5} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Streaks</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-28 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* Flame hero */}
          <div className="flex flex-col items-center py-6 mb-2">
            <div className="h-16 w-16 rounded-full bg-orange-500/15 border border-orange-500/20 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" strokeWidth={0}>
                <path d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9z" fill="#f97316" />
                <path d="M12 12c0 0-2 1.5-2 3a2 2 0 004 0c0-1.5-2-3-2-3z" fill="#fbbf24" />
              </svg>
            </div>
            <p className="text-5xl font-bold text-white">7</p>
            <p className="text-base font-semibold text-white/70 mt-1">Day Streak</p>
            <p className="text-xs text-white/40 mt-1">Keep it up! Consistency is the key.</p>
          </div>

          {/* Stats row */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4 grid grid-cols-3 divide-x divide-white/[0.06] mb-6">
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-2xl font-bold text-orange-400">7</span>
              <span className="text-[10px] text-white/40">Current Streak</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-2xl font-bold text-indigo-400">12</span>
              <span className="text-[10px] text-white/40">Longest Streak</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-2xl font-bold text-emerald-400">85%</span>
              <span className="text-[10px] text-white/40">Consistency</span>
            </div>
          </div>

          {/* Calendar */}
          <p className="text-sm font-semibold text-white mb-3">Streak Calendar</p>
          <div className="mb-6">
            <StreakCalendar />
          </div>

          {/* Milestones */}
          <p className="text-sm font-semibold text-white mb-3">Streak Milestones</p>
          <div className="space-y-3">
            {milestones.map((m, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.done ? "bg-orange-500/15 border border-orange-500/20" : "bg-white/[0.04] border border-white/5"}`}>
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" strokeWidth={0}>
                        <path d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9z" fill={m.done ? "#f97316" : "#ffffff30"} />
                        <path d="M12 12c0 0-2 1.5-2 3a2 2 0 004 0c0-1.5-2-3-2-3z" fill={m.done ? "#fbbf24" : "#ffffff20"} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{m.days} Days</p>
                      <p className="text-xs text-white/40 mt-0.5">{m.label}</p>
                    </div>
                  </div>
                  {m.done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" strokeWidth={1.5} />
                  ) : (
                    <span className="text-xs text-white/35 flex-shrink-0">{m.current}/{m.total}</span>
                  )}
                </div>
                {!m.done && (
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-all"
                      style={{ width: `${(m.current / m.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-white/[0.06] px-2 pb-6 pt-3 flex items-center justify-around z-50">
          {navItems.map((item) => (
            <Link key={item.label} to={item.to} className="flex flex-col items-center gap-1.5 px-3 text-white/35 hover:text-white/60 transition-colors">
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
