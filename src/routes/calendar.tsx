import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, SlidersHorizontal, Plus, Home, Calendar, Users, LayoutGrid, MoreHorizontal } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [{ title: "Calendar — The Flow" }],
  }),
  component: CalendarPage,
});

const weekDays = [
  { label: "Mon", date: 20 },
  { label: "Tue", date: 21 },
  { label: "Wed", date: 22, active: true },
  { label: "Thu", date: 23 },
  { label: "Fri", date: 24 },
  { label: "Sat", date: 25 },
  { label: "Sun", date: 26 },
];

const events = [
  {
    time: "08:00\nAM",
    title: "Calculus Practice",
    subject: "Mathematics",
    duration: "1h 30m",
    subjectColor: "text-violet-400",
    subjectBg: "bg-violet-500/10",
    accentColor: "bg-violet-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-violet-400">
        <path d="M4 4l6 6M10 4L4 10M14 8h6M14 12h4M14 16h6" />
      </svg>
    ),
    iconBg: "bg-violet-500/15",
  },
  {
    time: "10:00\nAM",
    title: "Physics: Newton's Laws",
    subject: "Physics",
    duration: "1h 15m",
    subjectColor: "text-blue-400",
    subjectBg: "bg-blue-500/10",
    accentColor: "bg-blue-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-blue-400">
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      </svg>
    ),
    iconBg: "bg-blue-500/15",
  },
  {
    time: "12:00\nPM",
    title: "Study Break",
    subject: "Break",
    duration: "45m",
    subjectColor: "text-emerald-400",
    subjectBg: "bg-emerald-500/10",
    accentColor: "bg-emerald-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-emerald-400">
        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    iconBg: "bg-emerald-500/15",
  },
  {
    time: "01:00\nPM",
    title: "Data Structures",
    subject: "Computer Science",
    duration: "2h",
    subjectColor: "text-amber-400",
    subjectBg: "bg-amber-500/10",
    accentColor: "bg-amber-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-amber-400">
        <path d="M8 6l-4 6 4 6M16 6l4 6-4 6M14 4l-4 16" />
      </svg>
    ),
    iconBg: "bg-amber-500/15",
  },
  {
    time: "03:30\nPM",
    title: "Biology: Cell Structure",
    subject: "Biology",
    duration: "1h 15m",
    subjectColor: "text-green-400",
    subjectBg: "bg-green-500/10",
    accentColor: "bg-green-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-green-400">
        <path d="M12 22c-4.97 0-9-2.69-9-6 0-2.12 1.6-4 4-5.08V9a5 5 0 0110 0v1.92c2.4 1.08 4 2.96 4 5.08 0 3.31-4.03 6-9 6z" />
      </svg>
    ),
    iconBg: "bg-green-500/15",
  },
  {
    time: "05:00\nPM",
    title: "History Revision",
    subject: "History",
    duration: "1h",
    subjectColor: "text-orange-400",
    subjectBg: "bg-orange-500/10",
    accentColor: "bg-indigo-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-orange-400">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    iconBg: "bg-orange-500/15",
  },
];

function AiTutorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function CalendarPage() {
  const [activeTab, setActiveTab] = useState("Day");
  const tabs = ["Day", "Week", "Month"];

  const navItems = [
    { icon: <Home className="h-5 w-5" strokeWidth={1.5} />, label: "Home", to: "/home" },
    { icon: <svg className="h-5 w-5" strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>, label: "Library", to: "/library" },
    { icon: <AiTutorIcon className="h-5 w-5" />, label: "AI Tutor", to: "/chat" },
    { icon: <Users className="h-5 w-5" strokeWidth={1.5} />, label: "Collab", to: "/collab" },
    { icon: <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />, label: "More", to: "/more" },
  ];

  return (
    <div className="fixed inset-0 bg-black text-white flex justify-center overflow-hidden page-transition">
      <div className="relative w-full max-w-md h-full flex flex-col">

        {/* Header */}
        <header className="px-6 pt-12 pb-3 flex-shrink-0 flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-tight">Calendar</h1>
          <div className="flex items-center gap-3">
            <button className="text-white/60 hover:text-white transition-colors">
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <button className="text-white/60 hover:text-white transition-colors">
              <SlidersHorizontal className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Day/Week/Month tabs */}
        <div className="px-6 mb-4 flex-shrink-0">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-white text-black"
                    : "bg-white/[0.06] text-white/60 hover:bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Week strip */}
        <div className="px-6 mb-5 flex-shrink-0">
          <div className="flex justify-between">
            {weekDays.map((d) => (
              <button
                key={d.date}
                className={`flex flex-col items-center gap-1.5 ${d.active ? "opacity-100" : "opacity-50"}`}
              >
                <span className="text-[10px] font-medium text-white/50 uppercase">{d.label}</span>
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-base font-semibold transition-colors ${
                    d.active
                      ? "bg-indigo-500 text-white"
                      : "text-white"
                  }`}
                >
                  {d.date}
                </div>
                {d.active && <div className="h-1 w-1 rounded-full bg-indigo-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Date label */}
        <div className="px-6 mb-4 flex-shrink-0">
          <h2 className="text-base font-semibold text-white">Wednesday, May 22</h2>
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-3">
            {events.map((ev, i) => (
              <div key={i} className="flex items-stretch gap-3">
                {/* Time */}
                <div className="w-14 flex-shrink-0 pt-3">
                  <p className="text-[10px] text-white/35 font-medium leading-tight whitespace-pre-line text-right">{ev.time}</p>
                </div>

                {/* Accent bar */}
                <div className={`w-0.5 rounded-full flex-shrink-0 ${ev.accentColor} opacity-70`} />

                {/* Card */}
                <div className="flex-1 rounded-2xl bg-white/[0.04] border border-white/5 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${ev.iconBg} flex items-center justify-center flex-shrink-0`}>
                      {ev.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{ev.title}</p>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ev.subjectBg} ${ev.subjectColor}`}>
                        {ev.subject}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-white/40 font-medium">{ev.duration}</span>
                    <button className="text-white/30 hover:text-white/60 transition-colors">
                      <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Event row */}
            <div className="flex items-stretch gap-3">
              <div className="w-14 flex-shrink-0" />
              <div className="w-0.5 flex-shrink-0" />
              <div className="flex-1 rounded-2xl border border-dashed border-white/10 px-4 py-3 flex items-center gap-3 text-white/30 hover:text-white/50 hover:border-white/20 transition-colors cursor-pointer">
                <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center flex-shrink-0">
                  <Plus className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium">Add Event</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAB */}
        <button className="absolute bottom-24 right-6 h-13 w-13 rounded-full bg-indigo-500 flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:bg-indigo-400 transition-colors z-40">
          <Plus className="h-6 w-6 text-white" strokeWidth={2} />
        </button>

        {/* Bottom Nav */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-white/[0.06] px-2 pb-6 pt-3 flex items-center justify-around z-50">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center gap-1.5 px-3 ${item.active ? "text-white" : "text-white/35"}`}
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
