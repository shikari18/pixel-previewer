import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, ChevronRight, Users, Sparkles, Home, LayoutGrid, Search, X } from "lucide-react";
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
  icon: React.ReactNode;
  iconBg: string;
  activeStatus: string;
};

// SVG Icons for subject groups
function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <path d="M9 3h6M9 3v7l-4.5 9A1 1 0 005.4 21h13.2a1 1 0 00.9-1.5L15 10V3M9 3H7M15 3h2" />
    </svg>
  );
}

function PiIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <path d="M5 7h14M12 7v10M8.5 7v3a3.5 3.5 0 007 0V7" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function AtomIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <path d="M9 21h6M12 3a6 6 0 00-3 11.22V17a1 1 0 001 1h4a1 1 0 001-1v-2.78A6 6 0 0012 3z" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
      <path d="M8 6l-4 6 4 6M16 6l4 6-4 6M14 4l-4 16" />
    </svg>
  );
}

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
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [addFriendUsername, setAddFriendUsername] = useState("");
  const [friendSearch, setFriendSearch] = useState("");
  const [groupChatMessage, setGroupChatMessage] = useState("");
  const [showAiHint, setShowAiHint] = useState(false);

  const tabs = ["Study Groups", "Friends", "Sessions"];

  const myGroups: Group[] = [
    {
      id: 1,
      title: "Chemistry Crew",
      subtitle: "4 members • Active now",
      icon: <FlaskIcon />,
      iconBg: "bg-violet-600",
      activeStatus: "now",
    },
    {
      id: 2,
      title: "Math Masters",
      subtitle: "6 members • Active 2h ago",
      icon: <PiIcon />,
      iconBg: "bg-emerald-700",
      activeStatus: "2h",
    },
    {
      id: 3,
      title: "History Buffs",
      subtitle: "3 members • Active yesterday",
      icon: <BookOpenIcon />,
      iconBg: "bg-amber-600",
      activeStatus: "yesterday",
    },
    {
      id: 4,
      title: "Physics Team",
      subtitle: "5 members • Active 3h ago",
      icon: <AtomIcon />,
      iconBg: "bg-blue-700",
      activeStatus: "3h",
    },
  ];

  const discoverGroups = [
    {
      id: 5,
      title: "Biology Learners",
      subtitle: "8 members • Active now",
      icon: <LightbulbIcon />,
      iconBg: "bg-violet-600",
    },
    {
      id: 6,
      title: "CS Study Circle",
      subtitle: "12 members • Active 1h ago",
      icon: <CodeIcon />,
      iconBg: "bg-neutral-700",
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
        <header className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
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

          {/* ======= STUDY GROUPS TAB ======= */}
          {activeTab === "Study Groups" && (
            <>
              {/* Hero Invitation Card */}
              <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-5 flex items-center justify-between min-h-[180px]">
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

                {/* Collab 3D Image — top right, transparent bg */}
                <div className="absolute top-0 right-0 h-full flex items-start justify-end pointer-events-none" style={{ background: "transparent" }}>
                  <img
                    src={collabImg}
                    alt="Collab Avatars"
                    className="h-full w-auto object-contain"
                    style={{ mixBlendMode: "lighten" }}
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
                        <div className={`h-11 w-11 rounded-xl ${group.iconBg} flex items-center justify-center flex-shrink-0`}>
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
                        <div className={`h-11 w-11 rounded-xl ${group.iconBg} flex items-center justify-center flex-shrink-0`}>
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

              {/* @AI Feature Note */}
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
                <p className="text-xs font-semibold text-indigo-300 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> @AI in Group Chat
                </p>
                <p className="text-xs text-white/50 leading-relaxed">
                  Type <span className="text-indigo-400 font-mono">@ai</span> in any group message to summon the AI Tutor directly in your study room.
                </p>
                <div className="mt-2 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2 flex items-center gap-2">
                  <input
                    value={groupChatMessage}
                    onChange={(e) => {
                      setGroupChatMessage(e.target.value);
                      setShowAiHint(e.target.value.includes("@ai") || e.target.value.includes("@AI"));
                    }}
                    placeholder="Try typing @ai explain osmosis..."
                    className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 outline-none"
                  />
                </div>
                {showAiHint && (
                  <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 text-xs text-indigo-300 flex items-center gap-2">
                    <Sparkles className="h-3 w-3 flex-shrink-0" />
                    AI Tutor would respond here in the group chat.
                  </div>
                )}
              </div>
            </>
          )}

          {/* ======= FRIENDS TAB ======= */}
          {activeTab === "Friends" && (
            <div className="space-y-4">
              {/* Add Friend Modal */}
              {showAddFriendModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
                  <div className="w-full max-w-xs rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Add Friend</h3>
                      <button onClick={() => setShowAddFriendModal(false)} className="text-white/40 hover:text-white transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-white/50">Enter their username to send a friend request.</p>
                    <input
                      value={addFriendUsername}
                      onChange={(e) => setAddFriendUsername(e.target.value)}
                      placeholder="e.g. john_doe123"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
                    />
                    <button
                      onClick={() => { setShowAddFriendModal(false); setAddFriendUsername(""); }}
                      className="w-full rounded-xl bg-white py-2.5 text-xs font-bold text-black hover:scale-105 active:scale-95 transition-transform"
                    >
                      Send Request
                    </button>
                  </div>
                </div>
              )}

              {/* Header row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/35">Friends</span>
                <button
                  onClick={() => setShowAddFriendModal(true)}
                  className="flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
                >
                  <Plus className="h-3 w-3" /> Add Friend
                </button>
              </div>

              {/* Search bar */}
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                <Search className="h-4 w-4 text-white/30 flex-shrink-0" />
                <input
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  placeholder="Search friends..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                />
              </div>

              {/* Friends list */}
              {[
                { initials: "AK", name: "Ama Kusi", status: "Active now", statusColor: "bg-emerald-500" },
                { initials: "KO", name: "Kwame Owusu", status: "Active 1h ago", statusColor: "bg-white/30" },
                { initials: "SE", name: "Sara Enu", status: "Active 3h ago", statusColor: "bg-white/30" },
                { initials: "EB", name: "Eli Boateng", status: "Offline", statusColor: "bg-white/10" },
              ]
                .filter((f) =>
                  friendSearch === "" || f.name.toLowerCase().includes(friendSearch.toLowerCase())
                )
                .map((friend) => (
                  <div
                    key={friend.name}
                    className="flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/5 p-4 hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
                        {friend.initials}
                        <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#111111] ${friend.statusColor}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white leading-tight">{friend.name}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">{friend.status}</p>
                      </div>
                    </div>
                    <button className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                      Message
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* ======= SESSIONS TAB ======= */}
          {activeTab === "Sessions" && (
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/35 block">Upcoming Sessions</span>
              {[
                { subject: "Chemistry", topic: "Periodic Table Review", time: "Today, 4:00 PM", participants: ["AK", "KO", "SE"], subjectBg: "bg-violet-600" },
                { subject: "Math", topic: "Calculus: Derivatives", time: "Tomorrow, 3:00 PM", participants: ["EB", "KO"], subjectBg: "bg-emerald-700" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/5 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold text-white ${s.subjectBg}`}>{s.subject}</span>
                      <h3 className="text-sm font-semibold text-white leading-tight">{s.topic}</h3>
                      <p className="text-xs text-white/40">{s.time}</p>
                    </div>
                    <button className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-black hover:scale-105 active:scale-95 transition-transform">
                      Join
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/30">Participants:</span>
                    {s.participants.map((p) => (
                      <div key={p} className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[9px] font-bold text-indigo-300">
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/35 block pt-2">Past Sessions</span>
              {[
                { subject: "History", topic: "World War II Summary", time: "Yesterday, 5:00 PM", participants: ["AK", "EB", "SE"], subjectBg: "bg-amber-600" },
                { subject: "Physics", topic: "Newton's Laws of Motion", time: "2 days ago", participants: ["KO", "AK"], subjectBg: "bg-blue-700" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 space-y-3 opacity-60">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold text-white ${s.subjectBg}`}>{s.subject}</span>
                      <h3 className="text-sm font-semibold text-white leading-tight">{s.topic}</h3>
                      <p className="text-xs text-white/40">{s.time}</p>
                    </div>
                    <span className="text-[10px] text-white/30 font-medium mt-1">Ended</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/30">Participants:</span>
                    {s.participants.map((p) => (
                      <div key={p} className="h-6 w-6 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[9px] font-bold text-white/40">
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

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
