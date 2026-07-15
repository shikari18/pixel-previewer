import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mic, MicOff, Video, PhoneOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import aiSphereImg from "@/assets/my-ai.png";

export const Route = createFileRoute("/ai-call")({
  head: () => ({
    meta: [{ title: "AI Tutor Call — The Flow" }],
  }),
  component: AiCallPage,
});

function AiCallPage() {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [aiText, setAiText] = useState("Hi! I'm Mr. Simon. Ask me anything about your studies!");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef(window.speechSynthesis);

  // Call timer
  useEffect(() => {
    const interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Speak initial greeting
  useEffect(() => {
    speakText("Hi! I'm Mr. Simon. Ask me anything about your studies!");
    return () => { synthRef.current.cancel(); };
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const speakText = (text: string) => {
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Daniel") || v.name.includes("Samantha"));
    if (preferred) utt.voice = preferred;
    utt.rate = 0.95;
    utt.pitch = 1.0;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utt);
  };

  const startListening = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) { alert("Speech recognition not supported in this browser."); return; }
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = async (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      await getAiResponse(text);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const getAiResponse = async (userText: string) => {
    setIsSpeaking(true);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are Mr. Simon, a friendly AI Tutor. Answer academic questions conversationally and concisely — keep responses under 3 sentences for voice. Be warm and encouraging." },
            { role: "user", content: userText },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Could you repeat that?";
      setAiText(reply);
      speakText(reply);
    } catch {
      const err = "I had trouble connecting. Please try again.";
      setAiText(err);
      speakText(err);
    }
  };

  const endCall = () => {
    synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    navigate({ to: "/chat" });
  };

  return (
    <div className="fixed inset-0 bg-[#111111] text-white flex justify-center overflow-hidden">
      <div className="relative w-full max-w-md h-full flex flex-col items-center justify-between py-16 px-8">

        {/* Call duration */}
        <div className="text-center">
          <p className="text-xs text-white/40 font-medium tracking-widest uppercase">AI Tutor Call</p>
          <p className="text-sm text-white/60 mt-1">{formatDuration(callDuration)}</p>
        </div>

        {/* AI Avatar */}
        <div className="flex flex-col items-center gap-6">
          <div className={`relative rounded-full ${isSpeaking ? "ring-4 ring-indigo-400/50 ring-offset-4 ring-offset-[#111111]" : ""} transition-all duration-300`}>
            <img
              src={aiSphereImg}
              alt="Mr. Simon"
              className="w-48 h-48 rounded-full object-cover"
            />
            {isSpeaking && (
              <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400/20" />
            )}
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold text-white">Mr. Simon</p>
            <p className="text-xs text-white/40">
              {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Tap mic to speak"}
            </p>
          </div>

          {/* AI speech text */}
          {aiText && (
            <div className="max-w-xs text-center">
              <p className="text-sm text-white/60 leading-relaxed italic">"{aiText}"</p>
            </div>
          )}

          {/* User transcript */}
          {transcript && (
            <div className="max-w-xs text-center">
              <p className="text-xs text-white/30">You said: "{transcript}"</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-8">
          {/* Video (placeholder) */}
          <button className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
              <Video className="h-6 w-6 text-white/70" strokeWidth={1.8} />
            </div>
            <span className="text-[10px] text-white/40">Video</span>
          </button>

          {/* End call — center */}
          <button onClick={endCall} className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-400 active:scale-95 transition-all shadow-[0_4px_20px_rgba(239,68,68,0.4)]">
              <PhoneOff className="h-7 w-7 text-white" strokeWidth={2} />
            </div>
            <span className="text-[10px] text-white/40">End</span>
          </button>

          {/* Mute / Speak */}
          <button
            onClick={() => {
              setIsMuted(m => !m);
              if (isListening && recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); }
              else if (!isMuted) startListening();
            }}
            className="flex flex-col items-center gap-2"
          >
            <div className={`h-14 w-14 rounded-full border flex items-center justify-center hover:opacity-80 active:scale-95 transition-all ${
              isListening ? "bg-indigo-500 border-indigo-400" : isMuted ? "bg-white/10 border-white/10" : "bg-white/10 border-white/10"
            }`}>
              {isMuted ? <MicOff className="h-6 w-6 text-white/60" strokeWidth={1.8} /> : <Mic className={`h-6 w-6 ${isListening ? "text-white" : "text-white/70"}`} strokeWidth={1.8} />}
            </div>
            <span className="text-[10px] text-white/40">{isMuted ? "Unmute" : isListening ? "Listening" : "Speak"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
