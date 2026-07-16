import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mic, MicOff, Video, PhoneOff } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import aiSphereImg from "@/assets/my-ai.png";

export const Route = createFileRoute("/ai-call")({
  head: () => ({ meta: [{ title: "AI Tutor Call — The Flow" }] }),
  component: AiCallPage,
});

// Pick the best female voice available
function getBestFemaleVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  const priority = [
    "Google UK English Female",
    "Google US English",
    "Samantha",
    "Karen",
    "Moira",
    "Tessa",
    "Veena",
    "Fiona",
  ];
  for (const name of priority) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }
  // fallback: any female-sounding voice
  const female = voices.find(v =>
    v.name.toLowerCase().includes("female") ||
    v.name.toLowerCase().includes("woman") ||
    v.name === "Google UK English Female"
  );
  return female || voices.find(v => v.lang.startsWith("en")) || null;
}

function AiCallPage() {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [aiText, setAiText] = useState("Hi! I'm Mr. Simon. What would you like to study today?");
  const [status, setStatus] = useState<"greeting" | "listening" | "thinking" | "speaking" | "idle">("greeting");

  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef<any>(null);
  const mutedRef = useRef(false); // track mute in callback without stale closure
  const listeningRef = useRef(false);

  // Timer
  useEffect(() => {
    const iv = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const speakText = useCallback((text: string, onDone?: () => void) => {
    synthRef.current.cancel();
    // Wait for voices to load if needed
    const trySpeak = () => {
      const utt = new SpeechSynthesisUtterance(text);
      const voice = getBestFemaleVoice(synthRef.current);
      if (voice) utt.voice = voice;
      utt.rate = 0.92;
      utt.pitch = 1.05;
      utt.volume = 1.0;
      utt.onstart = () => { setIsSpeaking(true); setStatus("speaking"); };
      utt.onend = () => {
        setIsSpeaking(false);
        onDone?.();
      };
      utt.onerror = () => {
        setIsSpeaking(false);
        onDone?.();
      };
      synthRef.current.speak(utt);
    };

    if (synthRef.current.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => { trySpeak(); };
    } else {
      trySpeak();
    }
  }, []);

  const startListening = useCallback(() => {
    if (mutedRef.current || listeningRef.current) return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      listeningRef.current = false;
      setStatus("thinking");
      await getAiResponse(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
      listeningRef.current = false;
      setStatus("idle");
      // retry listening after short pause
      if (!mutedRef.current) setTimeout(startListening, 1500);
    };

    recognition.onend = () => {
      setIsListening(false);
      listeningRef.current = false;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    listeningRef.current = true;
    setStatus("listening");
  }, []);

  const getAiResponse = async (userText: string) => {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
              content: "You are Mr. Simon, a warm and knowledgeable AI Tutor. You are on a voice call with a student. Keep responses SHORT — 2-3 sentences max. Be conversational, clear, and encouraging. No markdown, no bullet points — just natural spoken sentences.",
            },
            { role: "user", content: userText },
          ],
          max_tokens: 120,
          temperature: 0.75,
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Could you repeat that?";
      setAiText(reply);
      speakText(reply, () => {
        setStatus("idle");
        // Auto-listen again after AI finishes speaking
        if (!mutedRef.current) setTimeout(startListening, 600);
      });
    } catch {
      const err = "I had trouble connecting. Please try again.";
      setAiText(err);
      speakText(err, () => {
        setStatus("idle");
        if (!mutedRef.current) setTimeout(startListening, 600);
      });
    }
  };

  // On mount: speak greeting then start listening
  useEffect(() => {
    const greeting = "Hi! I'm Mr. Simon. What would you like to study today?";
    speakText(greeting, () => {
      setStatus("idle");
      if (!mutedRef.current) setTimeout(startListening, 600);
    });
    return () => {
      synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [speakText, startListening]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    mutedRef.current = newMuted;
    if (newMuted) {
      // Stop listening when muted
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      listeningRef.current = false;
    } else {
      // Resume listening when unmuted
      if (!isSpeaking) setTimeout(startListening, 400);
    }
  };

  const endCall = () => {
    synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    navigate({ to: "/chat" });
  };

  const statusLabel = () => {
    if (isMuted) return "Muted";
    if (status === "listening") return "Listening...";
    if (status === "thinking") return "Thinking...";
    if (status === "speaking") return "Speaking...";
    if (status === "greeting") return "Connecting...";
    return "Connected";
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex justify-center overflow-hidden">
      <div className="relative w-full max-w-md h-full flex flex-col items-center justify-between py-16 px-8">

        {/* Top: call info */}
        <div className="text-center space-y-1">
          <p className="text-xs text-white/40 font-medium tracking-widest uppercase">AI Tutor · Voice Call</p>
          <p className="text-sm font-mono text-white/50">{formatDuration(callDuration)}</p>
        </div>

        {/* Center: avatar + status */}
        <div className="flex flex-col items-center gap-5">
          {/* Avatar with pulse ring when speaking */}
          <div className="relative">
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400/15 scale-110" />
                <div className="absolute inset-0 rounded-full animate-pulse bg-indigo-400/10 scale-125" />
              </>
            )}
            <div className={`rounded-full transition-all duration-300 ${isSpeaking ? "ring-2 ring-indigo-400/60 ring-offset-4 ring-offset-black" : ""}`}>
              <img
                src={aiSphereImg}
                alt="Mr. Simon"
                className="w-44 h-44 rounded-full object-cover"
              />
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xl font-semibold text-white">Mr. Simon</p>
            <p className={`text-xs font-medium transition-colors ${
              status === "listening" ? "text-emerald-400" :
              status === "thinking" ? "text-amber-400" :
              status === "speaking" ? "text-indigo-400" :
              isMuted ? "text-red-400" :
              "text-white/40"
            }`}>
              {statusLabel()}
            </p>
          </div>

          {/* AI last response */}
          <div className="max-w-[280px] text-center min-h-[60px] flex items-center justify-center">
            <p className="text-sm text-white/55 leading-relaxed italic">"{aiText}"</p>
          </div>

          {/* User last said */}
          {transcript && (
            <p className="text-xs text-white/25 text-center max-w-[240px]">You: "{transcript}"</p>
          )}
        </div>

        {/* Bottom: controls */}
        <div className="flex items-end justify-center gap-10">

          {/* Video — left */}
          <button className="flex flex-col items-center gap-2" onClick={() => {}}>
            <div className="h-14 w-14 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center hover:bg-white/[0.14] transition-colors">
              <Video className="h-6 w-6 text-white/60" strokeWidth={1.8} />
            </div>
            <span className="text-[10px] text-white/35">Video</span>
          </button>

          {/* End call — center, larger */}
          <button onClick={endCall} className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-400 active:scale-95 transition-all shadow-[0_4px_24px_rgba(239,68,68,0.45)]">
              <PhoneOff className="h-7 w-7 text-white" strokeWidth={2} />
            </div>
            <span className="text-[10px] text-white/35">End</span>
          </button>

          {/* Mute — right */}
          <button onClick={toggleMute} className="flex flex-col items-center gap-2">
            <div className={`h-14 w-14 rounded-full border flex items-center justify-center active:scale-95 transition-all ${
              isMuted
                ? "bg-red-500/20 border-red-500/40"
                : isListening
                ? "bg-emerald-500/20 border-emerald-400/40"
                : "bg-white/[0.08] border-white/10"
            }`}>
              {isMuted
                ? <MicOff className="h-6 w-6 text-red-400" strokeWidth={1.8} />
                : <Mic className={`h-6 w-6 ${isListening ? "text-emerald-400" : "text-white/60"}`} strokeWidth={1.8} />
              }
            </div>
            <span className="text-[10px] text-white/35">{isMuted ? "Unmute" : "Mute"}</span>
          </button>

        </div>
      </div>
    </div>
  );
}
