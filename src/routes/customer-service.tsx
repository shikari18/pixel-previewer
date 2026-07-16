import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  Mail,
  FileText,
  BookOpen,
  Shield,
  Search,
  Headphones,
  X,
  Send,
  Home,
  Users,
  LayoutGrid,
} from "lucide-react";
import { useState, useRef, useEffect, type FormEvent } from "react";

export const Route = createFileRoute("/customer-service")({
  head: () => ({
    meta: [
      { title: "Help & Support — The Flow" },
      { name: "description", content: "Get help and support for your The Flow account." },
    ],
  }),
  component: HelpSupportPage,
});

type Message = {
  sender: "user" | "agent";
  text: string;
};

function AiTutorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function HelpSupportPage() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "agent",
      text: "Hello! I'm Mr. Simon from support. How can I help you get back in the flow today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFaqIdx, setExpandedFaqIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (chatOpen) scrollToBottom();
  }, [messages, isLoading, chatOpen]);

  const faqs = [
    {
      q: "How do I create a study plan?",
      a: "Go to the Home dashboard, scroll to the Task Planner, and click '+ Add Task' to plan your study slots. You can also view and schedule sessions on the Calendar page.",
    },
    {
      q: "What is Focus Mode?",
      a: "Focus Mode lets you configure Pomodoro timers (Standard vs Strict). Strict mode locks distractions and sounds a chime when completed to help you maintain a deep flow state.",
    },
    {
      q: "How does AI Tutor work?",
      a: "Our AI Tutor (Mr. Simon) helps you understand complex academic concepts. Click the 'AI Tutor' tab in the bottom nav to start asking questions or summarize study content.",
    },
    {
      q: "Can I collaborate with my friends?",
      a: "Yes! The Collab page allows you to join virtual study rooms, track focus times together, and coordinate study sessions in real-time.",
    },
    {
      q: "How do streaks and achievements work?",
      a: "Completed study goals and daily focus sessions automatically increase your streak and unlock unique badges which you can track in the Achievements and Streaks pages.",
    },
  ];

  // Filtering FAQs based on search
  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userText = inputVal.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInputVal("");
    setIsLoading(true);

    const startTime = Date.now();

    try {
      const chatHistory = messages.map((m) => ({
        role: m.sender === "user" ? "user" : ("assistant" as const),
        content: m.text,
      }));

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
              
              Here is app information:
              - App: The Flow
              - Pricing: GH₵ 10/month for Flow Pro.
              - Pages: Home, Library, AI Tutor (chat), Collab, More (Achievements, Calendar, Streaks, Study Goals, Focus Timer, Settings, Help & Support).`,
            },
            ...chatHistory,
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) throw new Error("API call failed");

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "I apologize, could you please repeat that?";
      
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 3000 - elapsed);

      setTimeout(() => {
        setIsLoading(false);
        setMessages((prev) => [...prev, { sender: "agent", text: reply }]);
      }, remainingDelay);

    } catch (error) {
      console.error(error);
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 3000 - elapsed);
      
      setTimeout(() => {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            sender: "agent",
            text: "I'm having trouble connecting to support. Please try again or email us at support@flowstate.app",
          },
        ]);
      }, remainingDelay);
    }
  };

  // Bottom Navigation
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
        <header className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 bg-black">
          <button
            onClick={() => navigate({ to: "/more" })}
            className="text-white/60 hover:text-white mr-4 transition-colors p-1"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-center flex-1 pr-6">Help & Support</h1>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* Headset Circle Banner */}
          <div className="flex flex-col items-center justify-center my-6">
            <div className="h-20 w-20 rounded-full bg-white/[0.04] border border-white/5 flex items-center justify-center text-white mb-4 shadow-xl">
              <div className="h-16 w-16 rounded-full bg-black/60 border border-white/10 flex items-center justify-center">
                <Headphones className="h-8 w-8 text-white" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white text-center">How can we help you?</h2>
            <p className="text-sm text-white/40 text-center mt-1.5">We're here to support you on your learning journey.</p>
          </div>

          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-white/30" />
            <input
              type="text"
              placeholder="Search for help"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white/[0.03] border border-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/10 text-sm"
            />
          </div>

          {/* Frequently Asked Questions */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-white/40 mb-3 uppercase tracking-wider text-[11px]">Frequently Asked Questions</p>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/[0.04] overflow-hidden">
              {filteredFaqs.length === 0 ? (
                <div className="text-xs text-white/30 text-center py-6">No matching FAQs found.</div>
              ) : (
                filteredFaqs.map((faq, i) => {
                  const isExpanded = expandedFaqIdx === i;
                  return (
                    <div key={i} className="w-full">
                      <button
                        onClick={() => setExpandedFaqIdx(isExpanded ? null : i)}
                        className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.03] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="h-7 w-7 rounded-full bg-white/[0.04] border border-white/5 flex items-center justify-center text-white/50 flex-shrink-0 text-xs font-semibold">
                            ?
                          </div>
                          <span className="text-sm font-medium text-white leading-tight">{faq.q}</span>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-white/20 flex-shrink-0 ml-2 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                      </button>
                      
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 text-sm text-white/50 leading-relaxed border-t border-white/[0.02] bg-white/[0.01] animate-in fade-in duration-200">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              
              {/* View all FAQs link */}
              <button
                onClick={() => alert("All 25+ FAQs are currently indexed in search above.")}
                className="w-full py-4 text-center text-xs text-white/40 hover:text-white transition-colors flex items-center justify-center gap-1.5 font-medium"
              >
                <span>View all FAQs</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Get Support Options */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-white/40 mb-3 uppercase tracking-wider text-[11px]">Get Support</p>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/[0.04] overflow-hidden">
              
              {/* Live Chat */}
              <button
                onClick={() => setChatOpen(true)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.03] transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/60">
                    <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">Live Chat</p>
                    <p className="text-xs text-white/40 mt-1">Chat with our support team</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20" />
              </button>

              {/* Email Support */}
              <a
                href="mailto:support@flowstate.app"
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.03] transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/60">
                    <Mail className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">Email Support</p>
                    <p className="text-xs text-white/40 mt-1">Send us an email and we'll respond</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20" />
              </a>

              {/* Submit a Ticket */}
              <button
                onClick={() => alert("Support Ticket System: Please fill out the form sent to emmanuel.asante@example.com.")}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.03] transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/60">
                    <FileText className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">Submit a Ticket</p>
                    <p className="text-xs text-white/40 mt-1">Submit a request and we'll help you</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20" />
              </button>

              {/* Help Center */}
              <button
                onClick={() => alert("Redirecting to Flow State Knowledge Base...")}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/[0.03] transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/60">
                    <BookOpen className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">Help Center</p>
                    <p className="text-xs text-white/40 mt-1">Browse guides and tutorials</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20" />
              </button>

            </div>
          </div>

          {/* Still Need Help? */}
          <a
            href="mailto:support@flowstate.app"
            className="w-full rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between hover:bg-white/[0.04] transition-all mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Shield className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Still need help?</p>
                <p className="text-sm font-bold text-white mt-0.5">Contact us at <span className="text-indigo-400 font-semibold">support@flowstate.app</span></p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/20" />
          </a>

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

        {/* Live Chat Window Overlay */}
        {chatOpen && (
          <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 flex h-full sm:h-[460px] w-full sm:w-[350px] flex-col bg-black border-t sm:border border-white/10 sm:rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] overflow-hidden animate-in slide-in-from-bottom duration-250">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-white/[0.02] pt-14 sm:pt-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-white">
                  MS
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-black animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white leading-tight">Mr. Simon</h4>
                  <p className="text-[10px] text-emerald-400">Online Support Representative</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white/40 hover:text-white p-1 transition-colors"
                aria-label="Close chat"
              >
                <X className="h-6 w-6" strokeWidth={1.5} />
              </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 bg-black">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} gap-1`}
                >
                  <span className="text-[10px] text-white/30 px-1">
                    {msg.sender === "user" ? "You" : "Mr. Simon (Support)"}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                        : "bg-white/[0.03] border border-white/10 text-white/90 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[10px] text-white/30 px-1">Mr. Simon</span>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/50 rounded-tl-none animate-pulse">
                    Typing...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input footer */}
            <form onSubmit={handleSend} className="border-t border-white/10 p-4 bg-black/95 backdrop-blur-md pb-8 sm:pb-4 flex gap-2">
              <input
                type="text"
                placeholder="Ask Mr. Simon..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={isLoading}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 text-white"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isLoading}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
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
