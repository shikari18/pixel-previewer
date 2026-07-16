import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, X, Home, Users, LayoutGrid } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing Plans — The Flow" },
      { name: "description", content: "Choose a plan that fits your study style. Standard and Premium subscriptions." },
    ],
  }),
  component: Pricing,
});

function AiTutorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function Pricing() {
  const navigate = useNavigate();
  
  const search = typeof window !== "undefined" ? window.location.search : "";
  const isSignupSuccess = search.includes("signup=success");
  const initialPlan = search.includes("plan=plus") ? "plus" : "premium";
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(initialPlan);
  const [activating, setActivating] = useState(false);

  const handlePlanChoose = (plan: string) => {
    if (isSignupSuccess) {
      setActivating(true);
      setTimeout(() => {
        navigate({ to: "/onboarding/$step", params: { step: "1" } });
      }, 1800);
    } else {
      navigate({ to: "/signup", search: { plan } as any });
    }
  };

  const plusFeatures = [
    { text: "Distraction-Free Study Space", included: true },
    { text: "Standard Text-based AI Tutor Support", included: true },
    { text: "Collaborative Study Rooms with Friends", included: true },
    { text: "Calendar Scheduling & Streak Tracking", included: true },
    { text: "Goal Setting & Dashboard Metrics", included: true },
    { text: "Voice Calls with AI Tutor", included: false },
    { text: "24/7 Live Chat Support Help", included: false },
    { text: "Visual Concept AI Image Generation", included: false },
    { text: "Early Access to Beta Upgrades", included: false },
    { text: "Offline Downloads & Note Exports", included: false },
  ];

  const premiumFeatures = [
    { text: "Distraction-Free Study Space", included: true },
    { text: "Standard Text-based AI Tutor Support", included: true },
    { text: "Collaborative Study Rooms with Friends", included: true },
    { text: "Calendar Scheduling & Streak Tracking", included: true },
    { text: "Goal Setting & Dashboard Metrics", included: true },
    { text: "Interactive Voice Call with AI Tutor (Mr. Simon)", included: true },
    { text: "24/7 Live Support Chat Assistance", included: true },
    { text: "Visual Concept AI Image Generation", included: true },
    { text: "Early Access to Pre-release Beta Features", included: true },
    { text: "Offline Study Note Downloads & Exports", included: true },
  ];

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/settings" });
    }
  };

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
        <header className="flex items-center px-6 pt-6 pb-4 flex-shrink-0 bg-black">
          <button
            onClick={handleBack}
            className="text-white/60 hover:text-white mr-4 transition-colors p-1"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">{isSignupSuccess ? "Activate Membership" : "Membership"}</h1>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-6">
          
          <div className="text-center mt-2">
            <h2 className="text-3xl font-extrabold tracking-tight">{isSignupSuccess ? "Confirm Your Plan" : "Pricing Plans"}</h2>
            <p className="text-sm text-white/50 mt-2 max-w-sm mx-auto">
              {isSignupSuccess ? "Welcome to The Flow! Confirm your choice to unlock your space." : "Simple, transparent options to fuel your learning state."}
            </p>
          </div>

          {/* Plan Cards Container */}
          <div className="space-y-6">
            
            {/* Flow Plus Card (6 Cedis) */}
            <div
              onClick={() => setSelectedPlan("plus")}
              className={`rounded-3xl border p-6 relative overflow-hidden transition-all duration-300 cursor-pointer ${
                selectedPlan === "plus"
                  ? "bg-white/[0.04] border-indigo-500/60 shadow-[0_0_25px_rgba(99,102,241,0.1)]"
                  : "bg-white/[0.01] border-white/5 opacity-70 hover:opacity-90"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Flow Plus</h3>
                  <p className="text-xs text-white/40 mt-0.5">Essential focus workspace tools</p>
                </div>
                {selectedPlan === "plus" && (
                  <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 uppercase">
                    Selected
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5 mb-5">
                <span className="text-4xl font-extrabold tracking-tight">GH₵ 6</span>
                <span className="text-sm text-white/50">/ month</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanChoose("plus");
                }}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                  selectedPlan === "plus"
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {isSignupSuccess ? "Confirm & Activate Plus" : "Choose Flow Plus"}
              </button>

              <hr className="my-5 border-white/10" />

              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-white/30 font-bold">What's Included</p>
                <ul className="space-y-2.5">
                  {plusFeatures.map((feat, i) => (
                    <li key={i} className={`flex items-start gap-2.5 text-xs ${feat.included ? "text-white/80" : "text-white/20"}`}>
                      <div className={`flex h-4 w-4 items-center justify-center rounded-full mt-0.5 flex-shrink-0 ${
                        feat.included ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/20"
                      }`}>
                        {feat.included ? (
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        ) : (
                          <X className="h-2.5 w-2.5" strokeWidth={3} />
                        )}
                      </div>
                      <span className={!feat.included ? "line-through" : ""}>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Flow Premium Card (15 Cedis) */}
            <div
              onClick={() => setSelectedPlan("premium")}
              className={`rounded-3xl border p-6 relative overflow-hidden transition-all duration-300 cursor-pointer ${
                selectedPlan === "premium"
                  ? "bg-white/[0.04] border-indigo-500/60 shadow-[0_0_25px_rgba(99,102,241,0.15)]"
                  : "bg-white/[0.01] border-white/5 opacity-70 hover:opacity-90"
              }`}
            >
              {/* Premium Top Glow */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/10 rounded-full filter blur-xl pointer-events-none" />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                    <span>Flow Premium</span>
                    <span className="text-[10px] font-bold tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-1 py-0.5">PRO</span>
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">Advanced tutoring & visual aids</p>
                </div>
                {selectedPlan === "premium" && (
                  <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 uppercase">
                    Selected
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5 mb-5">
                <span className="text-4xl font-extrabold tracking-tight">GH₵ 15</span>
                <span className="text-sm text-white/50">/ month</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanChoose("premium");
                }}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                  selectedPlan === "premium"
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {isSignupSuccess ? "Confirm & Activate Premium" : "Choose Flow Premium"}
              </button>

              <hr className="my-5 border-white/10" />

              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-white/30 font-bold">What's Included</p>
                <ul className="space-y-2.5">
                  {premiumFeatures.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-white/80">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5 flex-shrink-0">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </div>
                      <span>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
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

        {activating && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
            <h3 className="text-lg font-bold text-white mt-2">Activating Flow Space...</h3>
            <p className="text-xs text-white/40">Preparing your personalized environment</p>
          </div>
        )}
      </div>
    </div>
  );
}
