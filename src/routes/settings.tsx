import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Flame,
  Clock,
  Trophy,
  TrendingUp,
  Moon,
  Globe,
  Bell,
  Sliders,
  Volume2,
  Database,
  Shield,
  Lock,
  Mail,
  Trash2,
  ChevronRight,
  Edit2,
  Home,
  Users,
  LayoutGrid,
  BellOff,
} from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — The Flow" },
      { name: "description", content: "Customize your preferences and account settings." },
    ],
  }),
  component: SettingsPage,
});

function AiTutorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function SettingsPage() {
  const navigate = useNavigate();

  // Settings State
  const [appearance, setAppearance] = useState("Dark");
  const [language, setLanguage] = useState("English");
  const [notifications, setNotifications] = useState(true);
  const [studyTime, setStudyTime] = useState("50 min");
  const [focusMode, setFocusMode] = useState("Strict");
  const [dnd, setDnd] = useState(false);

  // Bottom Navigation
  const navItems = [
    { icon: <Home className="h-5 w-5" strokeWidth={1.5} />, label: "Home", to: "/home" },
    { icon: <svg className="h-5 w-5" strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>, label: "Library", to: "/library" },
    { icon: <AiTutorIcon className="h-5 w-5" />, label: "AI Tutor", to: "/chat" },
    { icon: <Users className="h-5 w-5" strokeWidth={1.5} />, label: "Collab", to: "/collab" },
    { icon: <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />, label: "More", to: "/more", active: true },
  ];

  // Preference Handlers
  const toggleAppearance = () => {
    setAppearance((prev) => (prev === "Dark" ? "Light" : "Dark"));
  };

  const cycleLanguage = () => {
    const langs = ["English", "Spanish", "French", "German"];
    const idx = langs.indexOf(language);
    setLanguage(langs[(idx + 1) % langs.length]);
  };

  const cycleStudyTime = () => {
    const times = ["25 min", "40 min", "50 min", "60 min", "90 min"];
    const idx = times.indexOf(studyTime);
    setStudyTime(times[(idx + 1) % times.length]);
  };

  const toggleFocusMode = () => {
    setFocusMode((prev) => (prev === "Strict" ? "Standard" : "Strict"));
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex overflow-hidden page-transition">
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <header className="flex items-center px-6 pt-6 pb-4 flex-shrink-0 bg-black">
          <button
            onClick={() => navigate({ to: "/more" })}
            className="text-white/60 hover:text-white mr-4 transition-colors p-1"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* Profile Section */}
          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=180&h=180"
                alt="Emmanuel Asante"
                className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/30 p-0.5 shadow-2xl"
              />
              <button
                onClick={() => alert("Profile photo update coming soon!")}
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center border-2 border-black hover:bg-indigo-500 active:scale-95 transition-all"
                title="Edit avatar"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <h2 className="text-xl font-bold mt-4">Emmanuel Asante</h2>
            <p className="text-sm text-white/40 mt-0.5">emmanuel.asante@example.com</p>
          </div>

          {/* Stats Summary Bar */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 grid grid-cols-4 divide-x divide-white/[0.06] mb-8">
            <div className="flex flex-col items-center gap-1 px-1">
              <Flame className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
              <span className="text-lg font-bold text-white leading-tight">12</span>
              <span className="text-[9px] text-white/40 font-medium text-center">Day Streak</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-1">
              <Clock className="h-5 w-5 text-indigo-400" strokeWidth={1.5} />
              <span className="text-lg font-bold text-white leading-tight">128h</span>
              <span className="text-[9px] text-white/40 font-medium text-center">Focus Time</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-1">
              <Trophy className="h-5 w-5 text-indigo-400" strokeWidth={1.5} />
              <span className="text-lg font-bold text-white leading-tight">24</span>
              <span className="text-[9px] text-white/40 font-medium text-center">Achievements</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-1">
              <TrendingUp className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
              <span className="text-lg font-bold text-white leading-tight">85%</span>
              <span className="text-[9px] text-white/40 font-medium text-center">Progress</span>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-white/40 mb-3 uppercase tracking-wider text-[11px]">Preferences</p>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/[0.04] overflow-hidden">
              
              {/* Appearance */}
              <button
                onClick={toggleAppearance}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-indigo-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-white">Appearance</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/45">{appearance}</span>
                  <ChevronRight className="h-4 w-4 text-white/20" />
                </div>
              </button>

              {/* Language */}
              <button
                onClick={cycleLanguage}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-indigo-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-white">Language</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/45">{language}</span>
                  <ChevronRight className="h-4 w-4 text-white/20" />
                </div>
              </button>

              {/* Notifications */}
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-indigo-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-white">Notifications</span>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                    notifications ? "bg-indigo-600" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      notifications ? "translate-x-5.5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Default Study Time */}
              <button
                onClick={cycleStudyTime}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-indigo-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-white">Default Study Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/45">{studyTime}</span>
                  <ChevronRight className="h-4 w-4 text-white/20" />
                </div>
              </button>

              {/* Focus Mode */}
              <button
                onClick={toggleFocusMode}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Sliders className="h-5 w-5 text-indigo-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-white">Focus Mode</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/45">{focusMode}</span>
                  <ChevronRight className="h-4 w-4 text-white/20" />
                </div>
              </button>

              {/* Do Not Disturb */}
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  {dnd ? (
                    <BellOff className="h-5 w-5 text-indigo-400" strokeWidth={1.5} />
                  ) : (
                    <Bell className="h-5 w-5 text-indigo-400" strokeWidth={1.5} />
                  )}
                  <span className="text-sm font-medium text-white">Do Not Disturb</span>
                </div>
                <button
                  onClick={() => setDnd(!dnd)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                    dnd ? "bg-indigo-600" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      dnd ? "translate-x-5.5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Sound & Haptics */}
              <button
                onClick={() => alert("Sound & Haptics settings coming soon!")}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Volume2 className="h-5 w-5 text-indigo-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-white">Sound & Haptics</span>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20" />
              </button>

              {/* Data & Storage */}
              <button
                onClick={() => alert("Data & Storage settings coming soon!")}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-indigo-400" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-white">Data & Storage</span>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20" />
              </button>

            </div>
          </div>

          {/* Account Section */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-white/40 mb-3 uppercase tracking-wider text-[11px]">Account</p>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/[0.04] overflow-hidden">
              
              {/* Privacy */}
              <button
                onClick={() => alert("Privacy settings coming soon!")}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-white/60" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-white">Privacy</span>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20" />
              </button>

              {/* Change Password */}
              <button
                onClick={() => alert("Password reset link sent to emmanuel.asante@example.com!")}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-white/60" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-white">Change Password</span>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20" />
              </button>

              {/* Email Preferences */}
              <button
                onClick={() => alert("Email preference panel coming soon!")}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-white/60" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-white">Email Preferences</span>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20" />
              </button>

              {/* Delete Account */}
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to permanently delete your account? This action is irreversible.")) {
                    alert("Account deletion request submitted.");
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-red-500/[0.05] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-red-500" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-red-500">Delete Account</span>
                </div>
                <ChevronRight className="h-4 w-4 text-red-500/20" />
              </button>

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

      </div>
    </div>
  );
}
