import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — The Flow" },
      { name: "description", content: "Create your The Flow account to focus deeply and learn smarter." },
      { property: "og:title", content: "Create Account — The Flow" },
      { property: "og:description", content: "Create your The Flow account to focus deeply and learn smarter." },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/onboarding/$step", params: { step: "1" } });
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center page-transition">
      <div className="relative w-full max-w-md min-h-screen flex flex-col px-8 pt-12 pb-10">
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
          <h1 className="text-5xl font-bold tracking-tight">Create Account</h1>
          <p className="mt-3 text-lg text-white/50">Let's get you started</p>
        </div>

        <div className="mt-8 space-y-3">
          <button className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-4 flex items-center justify-center gap-3 text-base font-medium relative">
            <svg viewBox="0 0 24 24" className="h-5 w-5 absolute left-6" fill="currentColor" aria-hidden>
              <path d="M16.365 1.43c0 1.14-.42 2.2-1.26 3.03-.84.84-1.86 1.3-2.94 1.22-.13-1.08.42-2.22 1.2-3.02.84-.86 2.02-1.34 3-1.23zM20.5 17.06c-.55 1.27-.81 1.83-1.51 2.95-.98 1.56-2.36 3.51-4.07 3.53-1.52.02-1.91-.99-3.97-.97-2.06.01-2.49.99-4.01.97-1.71-.02-3.02-1.78-4-3.34C.06 15.83-.42 10.62 1.4 7.85c1.29-1.96 3.32-3.11 5.24-3.11 1.95 0 3.18 1.07 4.79 1.07 1.56 0 2.51-1.07 4.77-1.07 1.71 0 3.52.93 4.81 2.54-4.23 2.32-3.54 8.36-.51 9.78z" />
            </svg>
            <span>Continue with Apple</span>
          </button>
          <button className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-4 flex items-center justify-center gap-3 text-base font-medium relative">
            <svg viewBox="0 0 48 48" className="h-5 w-5 absolute left-6" aria-hidden>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-sm text-white/50">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-base placeholder:text-white/40 focus:outline-none focus:border-white/25"
          />
          <input
            type="email"
            placeholder="Email Address"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-base placeholder:text-white/40 focus:outline-none focus:border-white/25"
          />
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 pr-14 text-base placeholder:text-white/40 focus:outline-none focus:border-white/25"
            />
            <button
              type="button"
              aria-label="Toggle password"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
            >
              {showPw ? <EyeOff className="h-5 w-5" strokeWidth={1.5} /> : <Eye className="h-5 w-5" strokeWidth={1.5} />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 pr-14 text-base placeholder:text-white/40 focus:outline-none focus:border-white/25"
            />
            <button
              type="button"
              aria-label="Toggle confirm password"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
            >
              {showConfirm ? <EyeOff className="h-5 w-5" strokeWidth={1.5} /> : <Eye className="h-5 w-5" strokeWidth={1.5} />}
            </button>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-2xl bg-white text-black font-medium py-4 text-base shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link to="/signin" className="text-white font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
