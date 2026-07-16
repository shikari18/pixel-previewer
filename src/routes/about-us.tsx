import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Target, Shield, Heart, Home, Users, LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/about-us")({
  head: () => ({
    meta: [
      { title: "About Us — The Flow" },
      { name: "description", content: "Learn about the mission, values, and vision of The Flow." },
    ],
  }),
  component: AboutUs,
});

function AiTutorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function AboutUs() {
  const navigate = useNavigate();

  const values = [
    {
      icon: <Target className="h-5 w-5 text-white/80" strokeWidth={1.5} />,
      title: "Deep Focus",
      desc: "We design features that actively minimize distractions, helping you enter and maintain flow states.",
    },
    {
      icon: <Shield className="h-5 w-5 text-white/80" strokeWidth={1.5} />,
      title: "Simplicity First",
      desc: "Our user interfaces are lightweight, clean, and intuitive, prioritizing functionality and clarity.",
    },
    {
      icon: <Heart className="h-5 w-5 text-white/80" strokeWidth={1.5} />,
      title: "Continuous Growth",
      desc: "Through calendar scheduling and AI tutoring, we build structures that support long-term habits.",
    },
  ];

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
        <header className="flex items-center px-6 pt-6 pb-4 flex-shrink-0 bg-black animate-fade-in">
          <button
            aria-label="Back"
            onClick={() => navigate({ to: "/more" })}
            className="text-white/60 hover:text-white mr-4 transition-colors p-1"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">About Flow State</h1>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold tracking-tight">Our Story</h2>
            <p className="mt-1.5 text-sm text-white/50">Our mission is to help minds align.</p>
          </div>

          <div className="mt-6 space-y-4 text-sm text-white/70 leading-relaxed">
            <p>
              The Flow was born out of a simple need: a focused, quiet environment in a loud digital world. We believe that learning shouldn't be about endless multitasking, but about immersion.
            </p>
            <p>
              We compile the best elements of focus timers, interactive calendars, AI tutors, and collaborative peer spaces into one cohesive, lightweight application.
            </p>
          </div>

          <section className="mt-8 space-y-4">
            <h3 className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold">Our Core Principles</h3>
            <div className="space-y-3.5">
              {values.map((val, i) => (
                <div key={i} className="flex gap-4 items-start p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="p-2.5 bg-white/[0.04] rounded-xl flex items-center justify-center flex-shrink-0">
                    {val.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{val.title}</h4>
                    <p className="mt-1 text-xs text-white/45 leading-relaxed">{val.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
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
