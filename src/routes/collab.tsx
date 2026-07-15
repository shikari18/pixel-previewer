import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, ChevronRight, Users, BookOpen, Sparkles, Home, LayoutGrid } from "lucide-react";
import { useState } from "react";
import collabImg from "@/assets/the-3-of-them.png";

export const Route = createFileRoute("/collab")({
  head: () => ({
    meta: [
      { title: "Collab — The Flow" },
      { name: "description", content: "Collaborative study rooms and groups." },
    ],
  }),
  component: CollabPage,
});

type Group = {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  activeStatus: string;
};

// Custom AI Tutor icon: Message bubble containing a star/sparkle
function AiTutorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function CollabPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Study Groups");

  const tabs = ["Study Groups", "Friends", "Sessions"];

  const myGroups: Group[] = [
    {
      id: 1,
      title: "Chemistry Crew",
      subtitle: "4 members • Active now",
      icon: "🧪",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      activeStatus: "now",
    },
    {
      id: 2,
      title: "Math Masters",
      subtitle: "6 members • Active 2h ago",
      icon: "π",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      activeStatus: "2h",
    },
    {
      id: 3,
      title: "History Buffs",
      subtitle: "3 members • Active yesterday",
      icon: "📖",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      activeStatus: "yesterday",
    },
    {
      id: 4,
      title: "Physics Team",
      subtitle: "5 members • Active 3h ago",
      icon: "⚛",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      activeStatus: "3h",
    },
  ];

  const discoverGroups = [
    {
      id: 5,
      title: "Biology Learners",
      subtitle: "8 members • Active now",
      icon: "💡",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
    },
    {
      id: 6,
      title: "CS Study Circle",
      subtitle: "12 members • Active 1h ago",
      icon: "💻",
      iconBg: "bg-white/[0.04]",
      iconColor: "text-white/60",
    },
  ];

  const navItems = [
    { icon: <Home className="h-5 w-5" strokeWidth={1.5} />, label: "Home", active: false, to: "/home" },
    { icon: <svg className="h-5 w-5" strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>, label: "Library", active: false, to: "/library" },
    { icon: <AiTutorIcon className="h-5 w-5" />, label: "AI Tutor", active: false, to: "/chat" },
    { icon: <Users className="h-5 w-5" strokeWidth={1.5} />, label: "Collab", active: true, to: "/collab" },
    { icon: <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />, label: "More", active: false, to: "/customer-service" },
  ];

  return (
    <div className="fixed inset-0 bg-[#111111] text-white flex justify-center overflow-hidden page-transition">
      <div className="relative w-full max-w-md h-full flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 pt-10 pb-4 flex-shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-white">Collab</h1>
          <button
            aria-label="Create new group"
            className="text-white/70 hover:text-white transition-colors"
          >
            <Plus className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 space-y-6">
          
          {/* Tabs */}
          <div className="flex gap-2">
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

          {/* Hero Invitation Card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-5 flex items-center justify-between min-h-[160px]">
            <div className="space-y-3 z-10 max-w-[60%]">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Users className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h2 className="text-sm font-semibold text-white leading-tight">Learn together, achieve more</h2>
              <p className="text-xs text-white/40">Join a study group or create your own.</p>
              <div className="flex gap-2 pt-1">
                <button className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-black hover:scale-105 active:scale-95 transition-transform">
                  Create Group
                </button>
                <button className="rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-[10px] font-bold text-white hover:bg-white/5 active:scale-95 transition-transform">
                  Join Group
                </button>
              </div>
            </div>

            {/* Collab 3D Image */}
            <div className="absolute right-0 bottom-0 w-[45%] h-full flex items-end justify-end pointer-events-none">
              <img
                src={collabImg}
                alt="Collab Avatars"
                className="max-h-[140px] w-auto object-contain mr-2 mb-2"
              />
            </div>
          </div>

          {/* Section: Your Groups */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/35">Your Groups</span>
              <button className="text-xs text-white/45 hover:text-white flex items-center gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {myGroups.map((group) => (
                <div
                  key={group.id}
                  className="w-full rounded-2xl bg-white/[0.04] border border-white/5 p-4 flex items-center justify-between hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 rounded-xl ${group.iconBg} ${group.iconColor} flex items-center justify-center text-lg font-bold flex-shrink-0`}>
                      {group.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-white leading-tight">{group.title}</h3>
                      <p className="text-xs text-white/40 mt-1">{group.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <ChevronRight className="h-4 w-4 text-white/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Discover Groups */}
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/35 block">Discover Groups</span>

            <div className="space-y-3">
              {discoverGroups.map((group) => (
                <div
                  key={group.id}
                  className="w-full rounded-2xl bg-white/[0.04] border border-white/5 p-4 flex items-center justify-between hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 rounded-xl ${group.iconBg} ${group.iconColor} flex items-center justify-center text-lg font-bold flex-shrink-0`}>
                      {group.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-white leading-tight">{group.title}</h3>
                      <p className="text-xs text-white/40 mt-1">{group.subtitle}</p>
                    </div>
                  </div>
                  <button className="rounded-full bg-indigo-500/20 border border-indigo-500/35 px-4 py-1.5 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Nav */}
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
        </div>

      </div>
    </div>
  );
}
