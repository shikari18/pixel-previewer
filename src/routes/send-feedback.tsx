import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Star, Send, CheckCircle, Home, Users, LayoutGrid } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/send-feedback")({
  head: () => ({
    meta: [
      { title: "Send Feedback — The Flow" },
      { name: "description", content: "Tell us what you think. Share suggestions, bugs, or praise." },
    ],
  }),
  component: SendFeedbackPage,
});

function AiTutorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function SendFeedbackPage() {
  const navigate = useNavigate();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<string>("suggestion");
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [email, setEmail] = useState<string>("emmanuel.asante@example.com");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const categories = [
    { id: "suggestion", label: "Suggestion" },
    { id: "bug", label: "Bug Report" },
    { id: "question", label: "Question" },
    { id: "praise", label: "Praise" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || rating === 0) {
      alert("Please provide a rating and comments before submitting.");
      return;
    }
    
    // Simulate submission
    setSubmitted(true);
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
            onClick={() => navigate({ to: "/more" })}
            className="text-white/60 hover:text-white mr-4 transition-colors p-1"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Send Feedback</h1>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6 mt-2">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Help us grow</h2>
                <p className="text-sm text-white/50 mt-1.5 leading-relaxed">Emmanuel, your feedback directly shapes the futures and features of The Flow state app.</p>
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Feedback Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`py-3 px-4 rounded-xl border text-xs font-semibold transition-all ${
                        category === cat.id
                          ? "bg-indigo-600/10 border-indigo-500 text-white"
                          : "bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Star rating */}
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Overall Experience</label>
                <div className="flex items-center gap-2.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-none transition-transform active:scale-90"
                      >
                        <Star
                          className={`h-7 w-7 transition-all ${
                            filled ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" : "text-white/20"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message text */}
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Feedback Details</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tell us what you like, what is broken, or features you want to see..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50 text-sm resize-none leading-relaxed"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Contact Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50 text-sm"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(99,102,241,0.3)]"
              >
                <Send className="h-4 w-4" />
                <span>Submit Feedback</span>
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-bounce">
                <CheckCircle className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-white">Feedback Submitted!</h2>
                <p className="text-sm text-white/50 max-w-xs leading-relaxed">Thank you, Emmanuel. We've received your report. Your insights help us build a better flow for everyone.</p>
              </div>
              <button
                onClick={() => navigate({ to: "/more" })}
                className="px-6 py-2.5 rounded-full border border-white/10 text-sm hover:bg-white/[0.04] transition-colors"
              >
                Back to More
              </button>
            </div>
          )}

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
