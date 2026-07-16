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
  Phone,
} from "lucide-react";
import { useState, useRef, useEffect, type FormEvent } from "react";
import aiSphereImg from "@/assets/my-ai.png";

type Message = { sender: "user" | "agent"; text: string };
type AttachedFile = { name: string; type: string; previewUrl?: string };

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Tutor — The Flow" },
      { name: "description", content: "Dedicated AI Tutor fullscreen chat." },
    ],
  }),
  component: ChatSupport,
});

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

function TypedMessageBubble({ text }: { text: string }) {
  const [typedText, setTypedText] = useState("");
  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) { setTypedText(text.slice(0, i + 1)); i++; }
      else clearInterval(iv);
    }, 4);
    return () => clearInterval(iv);
  }, [text]);
  return <FormatAiResponse text={typedText} />;
}

function FormatAiResponse({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        if (line.startsWith("### ") || line.startsWith("## ")) {
          return <h4 key={idx} className="text-sm font-bold text-white mt-3 mb-1">{line.replace(/^(###|##)\s+/, "")}</h4>;
        }
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          return <li key={idx} className="ml-4 list-disc text-white/85 text-sm leading-relaxed">{parseBold(line.trim().replace(/^(-\s*|\*\s*)/, ""))}</li>;
        }
        if (line.trim() === "") return <div key={idx} className="h-1.5" />;
        return <p key={idx} className="text-sm text-white/90 leading-relaxed">{parseBold(line)}</p>;
      })}
    </div>
  );
}

function parseBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-white">{p}</strong> : p);
}

function ChatSupport() {
  const navigate = useNavigate();
  const [chatStarted, setChatStarted] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatStarted) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, chatStarted]);

  const triggerPrompt = (text: string) => { setChatStarted(true); handleSendProcess(text); };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() && !attachedFile) return;
    if (isLoading) return;
    let text = inputVal.trim();
    if (attachedFile && !attachedFile.previewUrl) text = `[Attached ${attachedFile.type}: ${attachedFile.name}]\n` + text;
    setInputVal("");
    if (attachedFile?.previewUrl) URL.revokeObjectURL(attachedFile.previewUrl);
    setAttachedFile(null);
    setChatStarted(true);
    handleSendProcess(text);
  };

  const handleSendProcess = async (userText: string) => {
    setMessages(prev => [...prev, { sender: "user", text: userText }]);
    setIsLoading(true);
    const startTime = Date.now();
    try {
      const history = messages.map(m => ({ role: m.sender === "user" ? "user" : "assistant" as const, content: m.text }));
      history.push({ role: "user", content: userText });
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are Mr. Simon, a friendly, knowledgeable, and encouraging AI Tutor on The Flow app. You help students with ANY academic question across all subjects: Mathematics, Physics, Chemistry, Biology, Computer Science, History, Geography, English, Literature, Economics, and more.

RULES:
- Always be helpful, warm, and encouraging. Never refuse an academic question.
- CRITICAL: When a user asks HOW something works or to EXPLAIN something, start IMMEDIATELY with the explanation/mechanism — do NOT open with a definition. Jump straight into how it works.
- Break down concepts step-by-step with clear explanations, bullet points, and practical examples.
- Always include a "### Common Pitfalls" section for topic explanations.
- Format with ### headers and - bullet lists.
- Be conversational and supportive — if a student is struggling, encourage them.
- Do not mention images or diagrams.
- CRITICAL: If the user asks you to SUMMARIZE, make a summary, write a note, or condense something, keep it extremely concise, brief, and to the point. Do NOT include common pitfalls or a long breakdown for summary requests unless explicitly asked.`,
            },
            ...history,
          ],
          temperature: 0.75,
          max_tokens: 500,
        }),
      });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Could you repeat that?";
      const delay = Math.max(0, 4000 - (Date.now() - startTime));
      setTimeout(() => { setIsLoading(false); setMessages(prev => [...prev, { sender: "agent", text: reply }]); }, delay);
    } catch {
      const delay = Math.max(0, 4000 - (Date.now() - startTime));
      setTimeout(() => { setIsLoading(false); setMessages(prev => [...prev, { sender: "agent", text: "Having trouble connecting. Please check your network." }]); }, delay);
    }
  };

  const startNewChat = () => { setMessages([]); setChatStarted(false); setShowAllPrompts(false); if (attachedFile?.previewUrl) URL.revokeObjectURL(attachedFile.previewUrl); setAttachedFile(null); };

  const selectAttachment = (name: string, type: string) => { if (attachedFile?.previewUrl) URL.revokeObjectURL(attachedFile.previewUrl); setAttachedFile({ name, type }); setShowAttachments(false); };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (attachedFile?.previewUrl) URL.revokeObjectURL(attachedFile.previewUrl);
    setAttachedFile({ name: file.name, type: "Photo", previewUrl: URL.createObjectURL(file) });
    setShowAttachments(false);
    e.target.value = "";
  };

  const promptsToDisplay = showAllPrompts ? allPromptsList : popularPromptsList;

  const AttachmentDropdown = () => (
    <div className="absolute bottom-14 left-0 z-50 w-44 rounded-2xl border border-white/10 bg-[#1a1a1a] p-2 shadow-2xl">
      <button type="button" onClick={() => { photoInputRef.current?.click(); setShowAttachments(false); }} className="w-full rounded-xl px-3 py-2 flex items-center gap-3 text-xs hover:bg-white/[0.06] text-left transition-colors">
        <Camera className="h-4 w-4 text-violet-400" /> Photos
      </button>
      <button type="button" onClick={() => selectAttachment("video_lecture.mp4", "Video")} className="w-full rounded-xl px-3 py-2 flex items-center gap-3 text-xs hover:bg-white/[0.06] text-left transition-colors">
        <Video className="h-4 w-4 text-blue-400" /> Videos
      </button>
      <button type="button" onClick={() => selectAttachment("tutor_session", "Video Call")} className="w-full rounded-xl px-3 py-2 flex items-center gap-3 text-xs hover:bg-white/[0.06] text-left transition-colors">
        <PhoneCall className="h-4 w-4 text-emerald-400" /> Video Call
      </button>
      <button type="button" onClick={() => selectAttachment("notes.pdf", "PDF")} className="w-full rounded-xl px-3 py-2 flex items-center gap-3 text-xs hover:bg-white/[0.06] text-left transition-colors">
        <FileText className="h-4 w-4 text-amber-400" /> PDF
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black text-white flex overflow-hidden page-transition">
      <div className="relative w-full h-full flex flex-col">

        {/* Hidden photo input */}
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />

        {/* Header */}
        <header className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 bg-black">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate({ to: "/home" })} className="text-white/70 hover:text-white p-1 transition-colors" aria-label="Back">
              <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
            </button>
            <h1 className="text-xl font-bold tracking-tight">AI Tutor</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: "/ai-call" })}
              className="text-white/70 hover:text-white p-1 transition-colors"
              aria-label="Voice Call"
            >
              <Phone className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <button onClick={() => alert("Coming soon!")} className="text-white/70 hover:text-white p-1 transition-colors"><History className="h-5 w-5" strokeWidth={1.8} /></button>
            <button onClick={startNewChat} className="text-white/70 hover:text-white p-1 transition-colors"><MessageSquarePlus className="h-5 w-5" strokeWidth={1.8} /></button>
          </div>
        </header>

        {/* Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-36">
          {!chatStarted ? (
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="w-52 h-52 my-6 flex items-center justify-center">
                <img src={aiSphereImg} alt="AI" className="w-48 h-48 object-cover rounded-full" />
              </div>
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold">Hi Emmanuel!</h2>
                <p className="text-sm text-white/50 mt-1">How can I help you today?</p>
              </div>
              <div className="w-full flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/35">Popular Prompts</span>
                <button onClick={() => setShowAllPrompts(!showAllPrompts)} className="text-xs text-white/50 hover:text-white transition-colors">{showAllPrompts ? "Show Less" : "See All"}</button>
              </div>
              <div className="w-full space-y-3 mb-8">
                {promptsToDisplay.map((p, i) => (
                  <button key={i} onClick={() => triggerPrompt(p.text)} className="w-full rounded-2xl bg-white/[0.04] border border-white/5 p-4 flex items-center justify-between hover:bg-white/[0.06] transition-colors text-left">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-lg flex-shrink-0">{p.icon}</div>
                      <div><h3 className="text-sm font-semibold leading-snug">{p.text}</h3><p className="text-xs text-white/40 mt-0.5">{p.subject}</p></div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20" />
                  </button>
                ))}
              </div>
              {/* End of welcome prompts */}
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} gap-1`}>
                  <span className="text-[10px] text-white/30 px-1">{msg.sender === "user" ? "You" : "Mr. Simon"}</span>
                  {msg.sender === "user" ? (
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#6366f1] text-white rounded-tr-none">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ) : (
                    <div className="w-full pr-2">
                      {i === messages.length - 1 ? <TypedMessageBubble text={msg.text} /> : <FormatAiResponse text={msg.text} />}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[10px] text-white/30 px-1">Mr. Simon</span>
                  <div className="px-1 py-2 text-xs text-white/40 animate-pulse">Thinking...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Fixed input bar — always visible */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="w-full bg-black/95 backdrop-blur-md border-t border-white/5 px-4 pt-3 pb-6">
            {showAttachments && (
              <div className="relative">
                <AttachmentDropdown />
              </div>
            )}
            {attachedFile?.previewUrl && (
              <div className="relative inline-block mb-2">
                <img src={attachedFile.previewUrl} alt="Preview" className="h-16 w-16 rounded-xl object-cover border border-white/10" />
                <button type="button" onClick={() => { URL.revokeObjectURL(attachedFile.previewUrl!); setAttachedFile(null); }} className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-black/80 border border-white/20 flex items-center justify-center hover:bg-black"><X className="h-2.5 w-2.5" /></button>
              </div>
            )}
            {attachedFile && !attachedFile.previewUrl && (
              <div className="flex items-center justify-between rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-[11px] text-indigo-300 mb-2">
                <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" />{attachedFile.type}: {attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)}><X className="h-3.5 w-3.5 text-white/40 hover:text-white" /></button>
              </div>
            )}
            <form onSubmit={handleSend} className="flex items-center gap-3 w-full rounded-full border border-white/10 bg-white/[0.03] pl-2 pr-2 py-1.5 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
              <button type="button" onClick={() => setShowAttachments(!showAttachments)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all flex-shrink-0"><Plus className="h-5 w-5" /></button>
              <input type="text" placeholder="Ask anything..." value={inputVal} onChange={e => setInputVal(e.target.value)} disabled={isLoading} className="flex-1 bg-transparent border-0 outline-none text-white text-sm placeholder:text-white/30 h-9 py-1 px-1 focus:ring-0" />
              <button type="submit" disabled={(!inputVal.trim() && !attachedFile) || isLoading} className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white disabled:bg-white/10 disabled:text-white/30 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all flex-shrink-0 shadow-md"><Send className="h-4 w-4" strokeWidth={2.2} /></button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
