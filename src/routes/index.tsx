import { createFileRoute, Link } from "@tanstack/react-router";
import { Menu, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import waveImg from "@/assets/flow-wave.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Flow — Focus deeply. Learn smarter." },
      { name: "description", content: "Enter The Flow. Focus deeply. Learn smarter. Achieve more." },
      { property: "og:title", content: "The Flow" },
      { property: "og:description", content: "Focus deeply. Learn smarter. Achieve more." },
    ],
  }),
  component: Index,
});

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuItems = [
    { label: "Customer Service", to: "/customer-service" },
    { label: "About Us", to: "/about-us" },
    { label: "Pricing", to: "/pricing" }
  ];
  return (
    <div className="min-h-screen bg-black text-white flex page-transition">
      <div className="relative w-full min-h-screen flex flex-col px-5 pt-6 pb-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none" className="text-white">
              <path d="M1 7 Q7 -1 14 7 T27 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M1 13 Q7 5 14 13 T27 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
            <span className="text-lg font-medium tracking-tight">The Flow</span>
          </div>
          <button aria-label="Menu" onClick={() => setMenuOpen(true)} className="text-white/90">
            <Menu className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </header>

        <div className="absolute inset-x-0 top-24 h-[52%] pointer-events-none">
          <img
            src={waveImg}
            alt=""
            width={1024}
            height={768}
            className="w-full h-full object-cover opacity-90"
          />
        </div>

        <div className="relative mt-auto">
          <h1 className="text-6xl font-bold leading-[1.05] tracking-tight">
            Enter<br />The Flow
          </h1>
          <p className="mt-6 text-lg text-white/60 leading-snug">
            Focus deeply. Learn smarter.<br />Achieve more.
          </p>

          <div className="mt-10 space-y-3">
            <Link
              to="/pricing"
              className="block w-full rounded-2xl bg-white text-black font-medium py-4 text-sm text-center shadow-[0_0_40px_rgba(255,255,255,0.25)]"
            >
              Get Started
            </Link>
            <button className="w-full rounded-2xl border border-white/15 bg-white/[0.03] text-white font-medium py-4 text-sm flex items-center justify-center gap-2">
              Explore Features
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

      </div>

      <div
        className={`fixed inset-0 z-50 bg-black transition-all duration-500 ease-out ${
          menuOpen
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "translate-x-8 opacity-0 pointer-events-none"
        }`}
      >
        {/* subtle radial glow to match hero aesthetic */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.08),_transparent_60%)]" />

        <div className="relative mx-auto flex h-full w-full max-w-md flex-col px-8 pt-12 pb-10">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="28" height="20" viewBox="0 0 28 20" fill="none" className="text-white">
                <path d="M1 7 Q7 -1 14 7 T27 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M1 13 Q7 5 14 13 T27 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
              <span className="text-lg font-medium tracking-tight">The Flow</span>
            </div>
            <button
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition-colors hover:bg-white/10"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </header>

          <p className="mt-16 text-xs uppercase tracking-[0.25em] text-white/40">Menu</p>

          <nav className="mt-6 flex flex-col">
            {menuItems.map((item, i) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                style={{
                  transitionDelay: menuOpen ? `${120 + i * 60}ms` : "0ms",
                }}
                className={`group flex items-center justify-between border-b border-white/10 py-5 text-3xl font-semibold tracking-tight text-white/90 transition-all duration-500 ease-out hover:text-white ${
                  menuOpen ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight
                  className="h-5 w-5 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white/70"
                  strokeWidth={2}
                />
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-10 text-xs text-white/40">
            © {new Date().getFullYear()} The Flow
          </div>
        </div>
      </div>
    </div>
  );
}
