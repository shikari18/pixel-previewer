import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Send,
  History,
  MessageSquarePlus,
  ChevronRight,
  Plus,
  Camera,
  Video,
  PhoneCall,
  FileText,
  X,
} from "lucide-react";
import { useState, useRef, useEffect, type FormEvent } from "react";
import aiSphereImg from "@/assets/my-ai.png";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Tutor — The Flow" },
      { name: "description", content: "Dedicated AI Tutor fullscreen chat." },
    ],
  }),
  component: ChatSupport,
});

type Message = {
  sender: "user" | "agent";
  text: string;
};

const popularPromptsList = [
  { text: "Explain photosynthesis", subject: "Biology", icon: "🌱" },
  { text: "Solve this equation: 3x + 5 = 20", subject: "Math", icon: "Σ" },
  { text: "Summarize this chapter on World War II", subject: "History", icon: "📖" },
];

const allPromptsList = [
  ...popularPromptsList,
  { text: "Explain how black holes work", subject: "Physics", icon: "🌌" },
  { text: "What is a recursive function in programming?", subject: "Computer Science", icon: "💻" },
  { text: "How to structure a persuasive essay", subject: "English", icon: "✍️" },
  { text: "Balance this chemical equation: H2 + O2 = H2O", subject: "Chemistry", icon: "🧪" },
];

// Progressive Typing Animation Bubble
function TypedMessageBubble({ text }: { text: string }) {
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setTypedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 8); // Fast, fluid typing animation (speed 1)
    return () => clearInterval(interval);
  }, [text]);

  return <FormatAiResponse text={typedText} />;
}

// Rich formatter helper to output clean Markdown-like headers and bullets in chat responses
function FormatAiResponse({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        // Headers
        if (line.startsWith("### ") || line.startsWith("## ")) {
          const content = line.replace(/^(###|##)\s+/, "");
          return <h4 key={idx} className="text-sm font-bold text-white mt-3 mb-1">{content}</h4>;
        }
        // Bullet points
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          const content = line.trim().replace(/^(-\s*|\*\s*)/, "");
          return (
            <li key={idx} className="ml-4 list-disc text-white/80 text-sm leading-relaxed">
              {parseBoldText(content)}
            </li>
          );
        }
        // Normal text
        if (line.trim() === "") return <div key={idx} className="h-2" />;
        return <p key={idx} className="text-sm text-white/90 leading-relaxed">{parseBoldText(line)}</p>;
      })}
    </div>
  );
}

// Simple bold parser
function parseBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-bold text-white">{part}</strong> : part));
}

function ChatSupport() {
  const navigate = useNavigate();
  const [chatStarted, setChatStarted] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllPrompts, setShowAllPrompts] = useState(false);

  // Plus media button dropdown state
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (chatStarted) {
      scrollToBottom();
    }
  }, [messages, isLoading, chatStarted]);

  const triggerPrompt = (promptText: string) => {
    setChatStarted(true);
    handleSendProcess(promptText);
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() && !attachedFile) return;
    if (isLoading) return;
    
    let text = inputVal.trim();
    if (attachedFile) {
      text = `[Attached ${attachedFile.type}: ${attachedFile.name}]\n` + text;
    }
    
    setInputVal("");
    setAttachedFile(null);
    setChatStarted(true);
    handleSendProcess(text);
  };

  const handleSendProcess = async (userText: string) => {
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
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
              content: `You are Mr. Simon, an expert, encouraging, and highly analytical AI Tutor on The Flow app. Your sole objective is to guide the student to deep conceptual understanding.
- Treat the user as a learner. Break down concepts thoroughly, explaining core principles step-by-step.
- Always customize your replies dynamically. Include clear explanations, bullet points, and practical examples.
- CRITICAL: Always include warnings about common pitfalls, mistakes, misconceptions, or "places to watch out for" related to the subject.
- Format your response using clear section headers (###) and bulleted lists (-) naturally. Do not hardcode specific static emojis or specific layout titles unless they fit your dynamic response.
- Do not mention, reference, or output images, diagrams, or visual sketches in your responses.`,
            },
            ...chatHistory,
          ],
          temperature: 0.75,
          max_tokens: 450,
        }),
      });

      if (!response.ok) {
        throw new Error("API call failed");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "I apologize, could you repeat that?";
      
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 4000 - elapsed); // Force 4-second delay for human-like response

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
            text: "I'm having a bit of trouble connecting to your tutor right now. Please try again or check your network.",
          },
        ]);
      }, remainingDelay);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setChatStarted(false);
    setShowAllPrompts(false);
    setAttachedFile(null);
  };

  const selectAttachment = (name: string, type: string) => {
    setAttachedFile({ name, type });
    setShowAttachments(false);
  };

  const promptsToDisplay = showAllPrompts ? allPromptsList : popularPromptsList;

  return (
    <div className="fixed inset-0 bg-[#111111] text-white flex justify-center overflow-hidden page-transition">
      <div className="relative w-full max-w-md h-full flex flex-col">
        
        {/* Header with back arrow */}
        <header className="flex items-center justify-between px-6 pt-12 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: "/home" })}
              className="text-white/70 hover:text-white p-1 transition-colors"
              aria-label="Back to Home"
            >
              <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-white">AI Tutor</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("History feature coming soon!")}
              className="text-white/70 hover:text-white p-1 transition-colors"
              aria-label="Chat History"
            >
              <History className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <button
              onClick={startNewChat}
              className="text-white/70 hover:text-white p-1 transition-colors"
              aria-label="New Chat"
            >
              <MessageSquarePlus className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-6 pb-28">
          
          {!chatStarted ? (
            /* ================= WELCOME SCREEN ================= */
            <div className="flex flex-col items-center justify-center pt-2">
              
              {/* Glowing Sphere Image - larger, no glowing rings or shadows behind */}
              <div className="w-52 h-52 my-6 flex items-center justify-center">
                <img
                  src={aiSphereImg}
                  alt="AI Sphere"
                  className="w-48 h-48 object-cover rounded-full"
                />
              </div>

              {/* Greeting */}
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white">Hi Emmanuel!</h2>
                <p className="text-sm text-white/50 mt-1">How can I help you today?</p>
              </div>

              {/* Popular Prompts Title */}
              <div className="w-full flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/35">Popular Prompts</span>
                <button
                  onClick={() => setShowAllPrompts(!showAllPrompts)}
                  className="text-xs text-white/50 hover:text-white transition-colors"
                >
                  {showAllPrompts ? "Show Less" : "See All"}
                </button>
              </div>

              {/* Prompts Cards */}
              <div className="w-full space-y-3 mb-8">
                {promptsToDisplay.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => triggerPrompt(prompt.text)}
                    className="w-full rounded-2xl bg-white/[0.04] border border-white/5 p-4 flex items-center justify-between hover:bg-white/[0.06] transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-lg flex-shrink-0">
                        {prompt.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white leading-snug">{prompt.text}</h3>
                        <p className="text-xs text-white/40 mt-0.5">{prompt.subject}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20" />
                  </button>
                ))}
              </div>

              {/* Start new chat text area input */}
              <div className="w-full relative">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/35 block mb-3">Start a new chat</span>
                
                {/* Media Attachment Dropdown Menu */}
                {showAttachments && (
                  <div className="absolute bottom-24 left-3 z-50 w-44 rounded-2xl border border-white/10 bg-[#1a1a1a] p-2 shadow-2xl animate-page-slide">
                    <button
                      type="button"
                      onClick={() => selectAttachment("photo_attachment.jpg", "Photo")}
                      className="w-full rounded-xl px-3 py-2 flex items-center gap-3 text-xs hover:bg-white/[0.06] text-left transition-colors"
                    >
                      <Camera className="h-4 w-4 text-violet-400" /> Photos
                    </button>
                    <button
                      type="button"
                      onClick={() => selectAttachment("video_lecture.mp4", "Video")}
                      className="w-full rounded-xl px-3 py-2 flex items-center gap-3 text-xs hover:bg-white/[0.06] text-left transition-colors"
                    >
                      <Video className="h-4 w-4 text-blue-400" /> Videos
                    </button>
                    <button
                      type="button"
                      onClick={() => selectAttachment("tutor_session", "Video Call")}
                      className="w-full rounded-xl px-3 py-2 flex items-center gap-3 text-xs hover:bg-white/[0.06] text-left transition-colors"
                    >
                      <PhoneCall className="h-4 w-4 text-emerald-400" /> Video Call
                    </button>
                    <button
                      type="button"
                      onClick={() => selectAttachment("notes_ch4.pdf", "PDF")}
                      className="w-full rounded-xl px-3 py-2 flex items-center gap-3 text-xs hover:bg-white/[0.06] text-left transition-colors"
                    >
                      <FileText className="h-4 w-4 text-amber-400" /> PDF
                    </button>
                  </div>
                )}

                {/* Attached File Indicator */}
                {attachedFile && (
                  <div className="flex items-center justify-between rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 text-xs text-indigo-300 mb-2">
                    <span className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      {attachedFile.type}: {attachedFile.name}
                    </span>
                    <button onClick={() => setAttachedFile(null)} className="text-white/40 hover:text-white transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Unified input field: plus and submit inside the container */}
                <form onSubmit={handleSend} className="relative flex items-center gap-2 w-full rounded-2xl border border-white/10 bg-white/[0.02] pl-3 pr-2 py-1.5 focus-within:border-white/20">
                  <button
                    type="button"
                    onClick={() => setShowAttachments(!showAttachments)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/60 hover:text-white transition-colors"
                    aria-label="Add attachment"
                  >
                    <Plus className="h-5 w-5" />
                  </button>

                  <textarea
                    rows={1}
                    placeholder="Ask anything..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none text-white text-sm placeholder:text-white/30 h-9 py-2 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={(!inputVal.trim() && !attachedFile) || isLoading}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
                    aria-label="Submit Prompt"
                  >
                    <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </form>
                <p className="text-[10px] text-white/20 text-center mt-3">
                  AI can make mistakes. Check important info.
                </p>
              </div>

            </div>
          ) : (
            /* ================= ACTIVE CHAT THREAD SCREEN ================= */
            <div className="space-y-4 pt-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} gap-1`}
                >
                  <span className="text-[10px] text-white/30 px-1">
                    {msg.sender === "user" ? "You" : "Mr. Simon"}
                  </span>
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.15)] ${
                      msg.sender === "user"
                        ? "bg-[#6366f1] text-white rounded-tr-none"
                        : "bg-white/[0.03] border border-white/10 text-white/90 rounded-tl-none"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      /* Animate typing of speed 1 for agent's message if it is the latest one */
                      i === messages.length - 1 ? (
                        <TypedMessageBubble text={msg.text} />
                      ) : (
                        <FormatAiResponse text={msg.text} />
                      )
                    )}
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
          )}

        </div>

        {/* Input Bar Overlay (Only visible in active chat mode) */}
        {chatStarted && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 p-4 bg-[#111111]/95 backdrop-blur-md pb-6">
            
            {/* Media Attachment Dropdown Menu in Chat Mode */}
            {showAttachments && (
              <div className="absolute bottom-20 left-4 z-50 w-44 rounded-2xl border border-white/10 bg-[#1a1a1a] p-2 shadow-2xl animate-page-slide">
                <button
                  type="button"
                  onClick={() => selectAttachment("photo_attachment.jpg", "Photo")}
                  className="w-full rounded-xl px-3 py-2 flex items-center gap-3 text-xs hover:bg-white/[0.06] text-left transition-colors"
                >
                  <Camera className="h-4 w-4 text-violet-400" /> Photos
                </button>
                <button
                  type="button"
                  onClick={() => selectAttachment("video_lecture.mp4", "Video")}
                  className="w-full rounded-xl px-3 py-2 flex items-center gap-3 text-xs hover:bg-white/[0.06] text-left transition-colors"
                >
                  <Video className="h-4 w-4 text-blue-400" /> Videos
                </button>
                <button
                  type="button"
                  onClick={() => selectAttachment("tutor_session", "Video Call")}
                  className="w-full rounded-xl px-3 py-2 flex items-center gap-3 text-xs hover:bg-white/[0.06] text-left transition-colors"
                >
                  <PhoneCall className="h-4 w-4 text-emerald-400" /> Video Call
                </button>
                <button
                  type="button"
                  onClick={() => selectAttachment("notes_ch4.pdf", "PDF")}
                  className="w-full rounded-xl px-3 py-2 flex items-center gap-3 text-xs hover:bg-white/[0.06] text-left transition-colors"
                >
                  <FileText className="h-4 w-4 text-amber-400" /> PDF
                </button>
              </div>
            )}

            {/* Attached File Indicator */}
            {attachedFile && (
              <div className="flex items-center justify-between rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-[11px] text-indigo-300 mb-2 max-w-xs">
                <span className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  {attachedFile.type}: {attachedFile.name}
                </span>
                <button onClick={() => setAttachedFile(null)} className="text-white/40 hover:text-white transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Unified Input: Plus button inside */}
            <form onSubmit={handleSend} className="relative flex items-center gap-2 w-full rounded-xl border border-white/10 bg-white/[0.02] pl-3 pr-2 py-1.5 focus-within:border-white/20">
              <button
                type="button"
                onClick={() => setShowAttachments(!showAttachments)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-white/60 hover:text-white transition-colors flex-shrink-0"
                aria-label="Add attachment"
              >
                <Plus className="h-5 w-5" />
              </button>

              <input
                type="text"
                placeholder="Ask anything..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-transparent border-0 outline-none text-white text-sm placeholder:text-white/30 h-9 py-2"
              />
              
              <button
                type="submit"
                disabled={(!inputVal.trim() && !attachedFile) || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
