import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Home, Users, LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/achievements")({
  head: () => ({ meta: [{ title: "Achievements — The Flow" }] }),
  component: AchievementsPage,
});

function AiTutorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function CircleProgress({ value, total }: { value: number; total: number }) {
  const size = 96;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = value / total;
  const offset = circ - pct * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#6366f1" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mb-0.5">
          <path d="M12 15c-3.87 0-7-3.13-7-7V4h14v4c0 3.87-3.13 7-7 7z" />
          <path d="M8.21 15.89L7 19h10l-1.21-3.11M9 19v2h6v-2" />
        </svg>
        <span className="text-sm font-bold text-white leading-tight">{value}/{total}</span>
        <span className="text-[9px] text-white/40">Unlocked</span>
      </div>
    </div>
  );
}

function AchievementsPage() {
  const navigate = useNavigate();

  const unlocked = [
    { icon: "🕐", title: "First Session", desc: "Complete your first study session", date: "May 20, 2024" },
    { icon: "📅", title: "Consistent Learner", desc: "Study 3 days in a row", date: "May 25, 2024" },
    { icon: "🔥", title: "Focus Streak: 7 Days", desc: "Maintain a 7-day study streak", date: "Jun 1, 2024" },
    { icon: "🎯", title: "Goal Getter", desc: "Complete your first study goal", date: "Jun 10, 2024" },
  ];

  const inProgress = [
    { icon: "🏆", title: "Study Streak: 30 Days", desc: "Maintain a 30-day study streak", current: 12, total: 30 },
    { icon: "📖", title: "Deep Focus", desc: "Complete 10 focus sessions", current: 6, total: 10 },
  ];

  const locked = [
    { icon: "🌅", title: "Early Bird", desc: "Complete 5 sessions before 8AM", current: 0, total: 5 },
    { icon: "⚡", title: "Speed Learner", desc: "Complete 3 sessions in one day", current: 0, total: 3 },
    { icon: "🌙", title: "Night Owl", desc: "Study after 10PM five times", current: 1, total: 5 },
  ];

  const navItems = [
    { icon: <Home className="h-5 w-5" strokeWidth={1.5} />, label: "Home", to: "/home" },
    { icon: <svg className="h-5 w-5" strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>, label: "Library", to: "/library" },
    { icon: <AiTutorIcon className="h-5 w-5" />, label: "AI Tutor", to: "/chat" },
    { icon: <Users className="h-5 w-5" strokeWidth={1.5} />, label: "Collab", to: "/collab" },
    { icon: <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />, label: "More", to: "/more" },
  ];

  return (
    <div className="fixed inset-0 bg-black text-white flex overflow-hidden">
      <div className="relative w-full h-full flex flex-col">

        {/* Header */}
        <header className="flex items-center px-6 pt-14 pb-4 flex-shrink-0">
          <button onClick={() => navigate({ to: "/more" })} className="text-white/60 hover:text-white mr-4 transition-colors">
            <ArrowLeft className="h-6 w-6" strokeWidth={1.5} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-28 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* Hero progress card */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-5 flex items-center gap-5 mb-6">
            <CircleProgress value={12} total={28} />
            <div>
              <p className="text-base font-semibold text-white">Keep going, Emmanuel!</p>
              <p className="text-xs text-white/45 mt-1">You're making progress.</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 grid grid-cols-3 divide-x divide-white/[0.06] mb-8">
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-2xl font-bold text-indigo-400">12</span>
              <span className="text-[10px] text-white/40">Unlocked</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-2xl font-bold text-indigo-400">5</span>
              <span className="text-[10px] text-white/40">In Progress</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-2xl font-bold text-amber-400">11</span>
              <span className="text-[10px] text-white/40">Locked</span>
            </div>
          </div>

          {/* Unlocked */}
          <p className="text-sm font-semibold text-white mb-3">Unlocked</p>
          <div className="space-y-3 mb-8">
            {unlocked.map((a, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-lg flex-shrink-0">
                    {a.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{a.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">{a.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-[10px] text-white/30">{a.date}</span>
                  <ChevronRight className="h-4 w-4 text-white/20" />
                </div>
              </div>
            ))}
          </div>

          {/* In Progress */}
          <p className="text-sm font-semibold text-white mb-3">In Progress</p>
          <div className="space-y-3 mb-8">
            {inProgress.map((a, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/5 p-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-lg flex-shrink-0">
                    {a.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white leading-tight">{a.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">{a.desc}</p>
                  </div>
                  <span className="text-xs text-white/40 flex-shrink-0">{a.current}/{a.total}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${(a.current / a.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Locked */}
          <p className="text-sm font-semibold text-white/40 mb-3">Locked</p>
          <div className="space-y-3">
            {locked.map((a, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 opacity-50">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 text-white/30">
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 018 0v4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white leading-tight">{a.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">{a.desc}</p>
                  </div>
                  <span className="text-xs text-white/30 flex-shrink-0">{a.current}/{a.total}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-white/20" style={{ width: `${(a.current / a.total) * 100}%` }} />
                </div>
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
