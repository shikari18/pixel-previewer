import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, ChevronRight, PlusCircle, Home, LayoutGrid, Users, Calendar } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Subjects — The Flow" },
      { name: "description", content: "Explore subjects and learning materials." },
    ],
  }),
  component: LibraryPage,
});

type Subject = {
  id: number;
  title: string;
  topics: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  progress?: number;
  isNew?: boolean;
};

// Circular progress indicator component for subjects
function ProgressCircle({ percent }: { percent: number }) {
  const size = 38;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const strokeDashoffset = circ - (percent / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#10b981"
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold text-white">{percent}%</span>
    </div>
  );
}

function LibraryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");

  const tabs = ["All", "Favorites", "Recent"];

  const subjects: Subject[] = [
    {
      id: 1,
      title: "Mathematics",
      topics: "24 Topics",
      icon: "√x",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
    },
    {
      id: 2,
      title: "Physics",
      topics: "18 Topics",
      icon: "⚛",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      progress: 75,
    },
    {
      id: 3,
      title: "Computer Science",
      topics: "32 Topics",
      icon: "</>",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      progress: 60,
    },
    {
      id: 4,
      title: "Biology",
      topics: "16 Topics",
      icon: "🌿",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-400",
      progress: 40,
    },
    {
      id: 5,
      title: "History",
      topics: "20 Topics",
      icon: "🏛",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      isNew: true,
    },
  ];

  const navItems = [
    { icon: <Home className="h-5 w-5" strokeWidth={1.5} />, label: "Home", active: false, to: "/home" },
    { icon: <svg className="h-5 w-5" strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>, label: "Library", active: true, to: "/library" },
    { icon: <svg className="h-5 w-5" strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>, label: "AI Tutor", active: false, to: "/chat" },
    { icon: <Users className="h-5 w-5" strokeWidth={1.5} />, label: "Collab", active: false, to: "/collab" },
    { icon: <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />, label: "More", active: false, to: "/more" },
  ];

  return (
    <div className="fixed inset-0 bg-black text-white flex overflow-hidden page-transition">
      <div className="relative w-full h-full flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <button
            aria-label="Back"
            onClick={() => navigate({ to: "/home" })}
            className="text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={1.5} />
          </button>
          <button
            aria-label="Add Subject"
            className="text-white/70 hover:text-white transition-colors"
          >
            <Plus className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-6 pb-28">
          
          <h1 className="text-3xl font-bold tracking-tight mb-6">Subjects</h1>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-white text-black"
                    : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Subjects List */}
          <div className="space-y-4">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="w-full rounded-2xl bg-white/[0.04] border border-white/5 p-4 flex items-center justify-between hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`h-11 w-11 rounded-xl ${sub.iconBg} ${sub.iconColor} flex items-center justify-center text-lg font-bold flex-shrink-0`}>
                    {sub.icon}
                  </div>
                  {/* Title and Topics */}
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-white leading-tight">{sub.title}</h3>
                    <p className="text-xs text-white/40 mt-1">{sub.topics}</p>
                  </div>
                </div>

                {/* Progress Circle or Badge/Chevron */}
                <div className="flex items-center gap-2">
                  {sub.progress !== undefined ? (
                    <ProgressCircle percent={sub.progress} />
                  ) : sub.isNew ? (
                    <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-bold text-violet-400">
                      New
                    </span>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/30" />
                  )}
                </div>
              </div>
            ))}

            {/* Explore More card */}
            <div className="w-full rounded-2xl border border-dashed border-white/10 bg-transparent p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0">
                  <PlusCircle className="h-6 w-6 text-white/30" strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-white/80 leading-tight">Explore more subjects</h3>
                  <p className="text-xs text-white/40 mt-1">Discover new topics to learn</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/20" />
            </div>

          </div>

        </div>

        {/* Bottom Nav */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-x border-white/[0.06] rounded-t-[20px] px-2 pb-6 pt-3 flex items-center justify-around z-50">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center gap-1.5 px-4 ${
                item.active ? "text-white" : "text-white/35"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.active && <div className="h-0.5 w-4 bg-white rounded-full -mt-0.5" />}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
