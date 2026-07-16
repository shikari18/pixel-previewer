import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Mail, Phone, MessageSquare, X, Send } from "lucide-react";
import { useState, useRef, useEffect, type FormEvent } from "react";

export const Route = createFileRoute("/customer-service")({
  head: () => ({
    meta: [
      { title: "Customer Service — The Flow" },
      { name: "description", content: "Get help and support for your The Flow account." },
    ],
  }),
  component: CustomerService,
});

type Message = {
  sender: "user" | "agent";
  text: string;
};

function CustomerService() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "agent",
      text: "Hello! I'm Mr. Simon from support. How can I help you get back in the flow today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const faqs = [
    {
      q: "How do I reset my password?",
      a: "Click 'Forgot Password' on the Sign In page. We'll send an email with instructions to set a new password.",
    },
    {
      q: "How do I track my study streak?",
      a: "Your streak increases every day you complete at least one study session or checkbox task on your dashboard.",
    },
    {
      q: "Can I use The Flow on multiple devices?",
      a: "Yes! Your progress, library, and stats sync automatically across all web and mobile browsers.",
    },
  ];

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userText = inputVal.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInputVal("");
    setIsLoading(true);

    const startTime = Date.now();

    try {
      // Setup Groq API completions payload
      const chatHistory = messages.map((m) => ({
        role: m.sender === "user" ? "user" : ("assistant" as const),
        content: m.text,
      }));

      // Add the new user prompt
      chatHistory.push({ role: "user", content: userText });

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are Mr. Simon, a friendly, warm, and highly knowledgeable human customer support representative for The Flow app. Answer queries as a real human customer service agent sitting at your desk. Be empathetic, polite, and very concise. Never say you are an AI or language model. Answer in 2-3 sentences max.

Here is everything about The Flow app:
- App Name: The Flow.
- Mission: A minimalist study and focus workspace designed to block distractions, align minds, and help users reach deep focus ("flow states").
- Pricing: The Flow Pro plan costs exactly 10 Cedis a month (GH₵ 10 / month). There are no hidden fees. It includes:
  * Distraction-Free Study Space
  * Unlimited AI Tutor Queries (learn with AI)
  * Real-time Collaboration Study Rooms with friends
  * Full Offline Library Access & Downloads
  * Automatic Multi-device Syncing
  * Advanced Goal Analytics
- Pages & Routes:
  1. Welcome/Home (/): Pinned hero section with 3D ribbons, "Get Started" button (links to Sign Up), "Explore Features" button, and a hamburger menu.
  2. Sign In (/signin): Login with Email & Password, forgot password portal, and Apple/Google sign-in.
  3. Sign Up (/signup): Create account with Name, Email, Password, Confirm Password, and Google/Apple SSO. Pushed down slightly for clean vertical spacing.
  4. Onboarding (/onboarding/$step): 4-step introduction (Step 1: Welcome, Step 2: Focus Timers, Step 3: AI Tutor, Step 4: Success Tools).
  5. Dashboard (/home): Interactive dashboard with greeting, Pomodoro timer card, focus music player, weekly streak indicators, task plans, and stats.
  6. Library (/library): The Subjects page showing mathematics, physics (75%), computer science (60%), biology (40%), and history. When asked where the Library is, tell the user they can find it directly on the bottom navigation bar of the dashboard (the icon between Calendar and Collab).
  7. Support / Customer Service (/customer-service): FAQ lists and Contact Support details (email: support@theflow.com, phone: +233 24 000 0000), plus this chat box with you (Mr. Simon).
  8. Chat (/chat): Fullscreen direct chat window with you (Mr. Simon).
  9. About Us (/about-us): Explains the story of the app and core principles (Deep Focus, Simplicity, Continuous Growth).
  10. Pricing (/pricing): Details the Flow Pro plan which is 10 Cedis a month.`,
            },
            ...chatHistory,
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error("API call failed");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "I apologize, could you please repeat that?";
      
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 4000 - elapsed); // Force a 4-second delay to look human

      setTimeout(() => {
        setIsLoading(false);
        setMessages((prev) => [...prev, { sender: "agent", text: reply }]);
      }, remainingDelay);

    } catch (error) {
      console.error(error);
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 4000 - elapsed);
      
      setTimeout(() => {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            sender: "agent",
            text: "I'm having a bit of trouble connecting to support right now. Please try again or email us at support@theflow.com",
          },
        ]);
      }, remainingDelay);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex page-transition relative overflow-hidden">
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
          <h1 className="text-5xl font-bold tracking-tight">Support</h1>
          <p className="mt-3 text-lg text-white/50">We are here to help you get back in the flow.</p>
        </div>

        <section className="mt-10 space-y-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
                <h3 className="font-semibold text-base text-white">{faq.q}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold">Contact Us</h2>
          <div className="space-y-3">
            <a href="mailto:support@theflow.com" className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-4 px-5 flex items-center gap-4 hover:bg-white/5 transition-colors">
              <Mail className="h-5 w-5 text-white/70" strokeWidth={1.5} />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Email Support</p>
                <p className="text-xs text-white/50">support@theflow.com</p>
              </div>
            </a>
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-4 px-5 flex items-center gap-4">
              <Phone className="h-5 w-5 text-white/70" strokeWidth={1.5} />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Direct Line</p>
                <p className="text-xs text-white/50">+233 24 000 0000</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* CHATBOT BUTTON & FLOATING WINDOW CONTAINER */}
        {/* ========================================== */}
        
        {/* Floating Toggle Button */}
        <button
          onClick={() => setChatOpen((v) => !v)}
          className="absolute bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_30px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-transform"
          aria-label="Toggle chat support"
        >
          {chatOpen ? <X className="h-6 w-6" strokeWidth={2} /> : <MessageSquare className="h-6 w-6" strokeWidth={2} />}
        </button>

        {/* Chat window */}
        {chatOpen && (
          <div className="absolute bottom-24 right-6 z-50 flex h-[420px] w-[320px] flex-col rounded-3xl border border-white/15 bg-black/95 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-page-slide">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-white">
                  MS
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-black animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white leading-tight">Mr. Simon</h4>
                  <p className="text-[10px] text-emerald-400">Online Support</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Message Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} gap-1`}
                >
                  <span className="text-[10px] text-white/30 px-1">
                    {msg.sender === "user" ? "You" : "Mr. Simon"}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-[#6366f1] text-white rounded-tr-none"
                        : "bg-white/[0.03] border border-white/10 text-white/90 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Loader Typing Bubble */}
              {isLoading && (
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[10px] text-white/30 px-1">Mr. Simon</span>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/50 rounded-tl-none">
                    Typing...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSend} className="border-t border-white/10 p-3 bg-white/[0.01] flex gap-2">
              <input
                type="text"
                placeholder="Ask Mr. Simon..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={isLoading}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 disabled:opacity-50 text-white"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black disabled:opacity-40 disabled:hover:scale-100 hover:scale-105 active:scale-95 transition-transform"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
}
