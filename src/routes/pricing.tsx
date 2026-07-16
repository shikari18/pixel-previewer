import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — The Flow" },
      { name: "description", content: "Explore pricing plans for The Flow. Simple, transparent membership." },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const navigate = useNavigate();

  const features = [
    "Distraction-Free Study Space",
    "Unlimited AI Tutor Queries",
    "Real-time Collaboration Rooms",
    "Full Offline Library Access",
    "Automatic Multi-device Syncing",
    "Advanced Goal Analytics",
  ];

  return (
    <div className="min-h-screen bg-black text-white flex page-transition">
      <div className="relative w-full min-h-screen flex flex-col px-5 pt-12 pb-10">
        <header className="flex items-center justify-between">
          <button
            aria-label="Back"
            onClick={() => navigate({ to: "/" })}
            className="text-white/90"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </header>

        <div className="mt-10">
          <h1 className="text-5xl font-bold tracking-tight">Membership</h1>
          <p className="mt-3 text-lg text-white/50">Simple, transparent pricing to fuel your growth.</p>
        </div>

        {/* Pricing Card */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.02] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.03)]">
          {/* Subtle top glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/5 rounded-full filter blur-xl pointer-events-none" />

          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Flow Pro</h2>
              <p className="mt-1 text-sm text-white/50">Complete learning ecosystem</p>
            </div>
            <span className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-white/90">
              Popular
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight">GH₵ 10</span>
            <span className="text-lg text-white/50">/ month</span>
          </div>
          <p className="mt-2 text-sm text-white/40">Only 10 Cedis a month</p>

          <button
            onClick={() => navigate({ to: "/signup" })}
            className="mt-8 w-full rounded-2xl bg-white text-black font-semibold py-4 text-base shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:bg-white/90 transition-colors"
          >
            Get Started
          </button>

          <hr className="my-8 border-white/10" />

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold">What's included</p>
            <ul className="space-y-3">
              {features.map((feat) => (
                <li key={feat} className="flex items-center gap-3 text-sm text-white/70">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </div>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
