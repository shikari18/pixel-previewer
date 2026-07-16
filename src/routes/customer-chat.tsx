import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { useState, useRef, useEffect, type FormEvent } from "react";

export const Route = createFileRoute("/customer-chat")({
  head: () => ({
    meta: [
      { title: "Customer Support — The Flow" },
      { name: "description", content: "Dedicated app help and support chat." },
    ],
  }),
  component: CustomerHelpChat,
});

type Message = {
  sender: "user" | "agent";
  text: string;
};

function CustomerHelpChat() {
  const navigate = useNavigate();
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial welcome message from support
    setMessages([
      {
        sender: "agent",
        text: "Hello! I'm Mr. Simon from support. How can I help you with your account, pricing, or features today?",
      },
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
              content: `You are Mr. Simon, a warm, polite, and highly helpful human customer support agent for The Flow app. Answer queries as a real support agent sitting at your desk. Be empathetic and very concise. Never say you are an AI or language model. Answer in 2-3 sentences max.

Here is everything about The Flow app to help users:
- App Name: The Flow.
- Mission: A minimalist focus workspace designed to block distractions, align minds, and help users reach deep focus.
- Pricing: The Flow Pro plan costs exactly 10 Cedis a month (GH₵ 10 / month). There are no hidden fees.
- Key features of Pro:
  * Distraction-Free Study Space
  * Unlimited AI Tutor Queries (the AI Tutor tab)
  * Real-time Collaboration Study Rooms with friends (the Collab tab)
  * Full Offline Library Access & Downloads (the Library tab)
  * Automatic Multi-device Syncing
  * Advanced Goal Analytics
- Support FAQs:
  - Reset Password: Click 'Forgot Password' on the Sign In page to receive instructions.
  - Streaks: Increases daily when they complete at least one task or checkbox on their dashboard.
  - Multi-device support: Auto-syncs progress across all browsers and devices.`,
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
      const reply = data.choices?.[0]?.message?.content || "I apologize, could you repeat that?";
      
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 4000 - elapsed); // Force 4-second delay for support agent feeling

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
    <div className="fixed inset-0 bg-black text-white flex overflow-hidden page-transition">
      <div className="relative w-full h-full flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 pt-12 pb-4 flex-shrink-0 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <button
              aria-label="Back"
              onClick={() => navigate({ to: "/home" })}
              className="text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-white">
                MS
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-[#111111] animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white leading-tight">Mr. Simon</h4>
                <p className="text-[10px] text-emerald-400">Customer Help Representative</p>
              </div>
            </div>
          </div>
        </header>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin pb-24">
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
                    ? "bg-[#6366f1] text-white rounded-tr-none shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                    : "bg-white/[0.03] border border-white/10 text-white/90 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Loader */}
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

        {/* Input Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 p-4 bg-black/95 backdrop-blur-md pb-6">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask for support..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 disabled:opacity-50 text-white"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isLoading}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black disabled:opacity-40 disabled:hover:scale-100 hover:scale-105 active:scale-95 transition-transform"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
