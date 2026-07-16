import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Mic, MicOff, Video, PhoneOff, Sliders, X, Check, Volume2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import aiSphereImg from "@/assets/my-ai.png";

export const generateSpeechFn = createServerFn("POST", async ({ data, voiceId }: { data: string; voiceId: string }) => {
  try {
    const apiKey = "sk_car_GW1Vfb53x362GSeYoEKV4f";
    const response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "Cartesia-Version": "2024-06-10",
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_id: "sonic-3.5",
        transcript: data,
        voice: {
          mode: "id",
          id: voiceId,
        },
        output_format: {
          container: "mp3",
          bit_rate: 128000,
          sample_rate: 44100,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cartesia API failed: ${response.statusText} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return base64;
  } catch (err) {
    console.error("Error in Cartesia TTS server function:", err);
    throw err;
  }
});

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
  const [micError, setMicError] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("db6b0ed5-d5d3-463d-ae85-518a07d3c2b4");
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);

  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef<any>(null);
  const mutedRef = useRef(false); // track mute in callback without stale closure
  const listeningRef = useRef(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

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

  const fallbackSpeak = useCallback((text: string, onDone?: () => void) => {
    let isDoneTriggered = false;
    const triggerDone = () => {
      if (isDoneTriggered) return;
      isDoneTriggered = true;
      setIsSpeaking(false);
      onDone?.();
    };

    // Calculate dynamic safety timeout based on words (500ms per word + 3s buffer)
    const wordCount = text.split(/\s+/).length;
    const safetyTimeoutMs = Math.max(3000, (wordCount * 500) + 3000);
    const safetyTimer = setTimeout(() => {
      console.warn("SpeechSynthesis safety timeout hit. Cancelling speech.");
      synthRef.current.cancel();
      triggerDone();
    }, safetyTimeoutMs);

    const trySpeak = () => {
      synthRef.current.cancel(); // cancel any stuck speech
      const utt = new SpeechSynthesisUtterance(text);
      const voice = getBestFemaleVoice(synthRef.current);
      if (voice) utt.voice = voice;
      utt.rate = 0.92;
      utt.pitch = 1.05;
      utt.volume = 1.0;
      utt.onstart = () => { setIsSpeaking(true); setStatus("speaking"); };
      utt.onend = () => {
        clearTimeout(safetyTimer);
        triggerDone();
      };
      utt.onerror = () => {
        clearTimeout(safetyTimer);
        triggerDone();
      };
      synthRef.current.speak(utt);
    };

    if (synthRef.current.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => { trySpeak(); };
    } else {
      trySpeak();
    }
  }, []);

  const speakText = useCallback(async (text: string, onDone?: () => void) => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    synthRef.current.cancel();

    setIsSpeaking(true);
    setStatus("speaking");

    let isDoneTriggered = false;
    const triggerDone = () => {
      if (isDoneTriggered) return;
      isDoneTriggered = true;
      setIsSpeaking(false);
      onDone?.();
    };

    // Calculate dynamic safety timeout based on words (500ms per word + 3s buffer)
    const wordCount = text.split(/\s+/).length;
    const safetyTimeoutMs = Math.max(3000, (wordCount * 500) + 3000);
    const safetyTimer = setTimeout(() => {
      console.warn("TTS Audio play safety timeout hit. Forcing stop.");
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      triggerDone();
    }, safetyTimeoutMs);

    try {
      const base64 = await generateSpeechFn({ data: text, voiceId: selectedVoiceId });
      const audio = new Audio("data:audio/mp3;base64," + base64);
      activeAudioRef.current = audio;
      
      audio.onended = () => {
        clearTimeout(safetyTimer);
        triggerDone();
      };
      
      audio.onerror = () => {
        clearTimeout(safetyTimer);
        console.warn("Audio element failed, falling back to Web Speech API.");
        fallbackSpeak(text, triggerDone);
      };

      await audio.play();
    } catch (e) {
      clearTimeout(safetyTimer);
      console.warn("generateSpeechFn failed, falling back to Web Speech API:", e);
      fallbackSpeak(text, triggerDone);
    }
  }, [fallbackSpeak, selectedVoiceId]);

  const startListening = useCallback(() => {
    if (mutedRef.current || listeningRef.current || micError) return;
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

    recognition.onerror = (e: any) => {
      setIsListening(false);
      listeningRef.current = false;
      
      if (e.error === "not-allowed") {
        setMicError("Microphone access denied");
        setStatus("idle");
        return; // stop infinite retries if blocked
      }
      
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
  }, [micError]);

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
              content: "You are Mr. Simon, a warm, knowledgeable, and highly interactive AI Tutor. You are on a voice call with a student. Keep responses SHORT — 2-3 sentences max. Do NOT add generic motivational sign-offs or encouraging catchphrases at the end of replies. Always end with a relevant, contextual follow-up question or quiz check based on the topic you just discussed. If the student gets it wrong, calmly explain it in simpler terms and ask another simple check question. If they get it right, praise briefly, move to the next part, and ask a question. Keep it natural, conversational, spoken sentences only, without bullet points or markdown.",
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
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
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
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    navigate({ to: "/chat" });
  };

  const statusLabel = () => {
    const SpeechRec = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SpeechRec) return "Voice input unsupported in browser";
    if (micError) return micError;
    if (isMuted) return "Muted";
    if (status === "listening") return "Listening...";
    if (status === "thinking") return "Thinking...";
    if (status === "speaking") return "Speaking...";
    if (status === "greeting") return "Connecting...";
    return "Connected";
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex overflow-hidden">
      <div className="relative w-full h-full flex flex-col items-center justify-between py-16 px-8">

        {/* Top-Right Voice Selector Toggle */}
        <button
          onClick={() => setVoicePanelOpen(true)}
          className="absolute top-6 right-6 z-40 h-10 w-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          aria-label="Select voice"
        >
          <Sliders className="h-5 w-5" />
        </button>

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

        {/* Slide-out Voice Select Panel */}
        {voicePanelOpen && (
          <div className="absolute top-0 right-0 z-50 h-full w-72 bg-black/95 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col p-6 animate-in slide-in-from-right duration-250">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-indigo-400" />
                Select Voice
              </h3>
              <button
                onClick={() => setVoicePanelOpen(false)}
                className="text-white/40 hover:text-white p-1 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List of Voices */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 select-none [&::-webkit-scrollbar]:hidden">
              
              {/* Female Voices Section */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Realistic Female Voices</p>
                <div className="space-y-2.5">
                  {[
                    { id: "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4", name: "Skylar", desc: "Warm & conversational" },
                    { id: "f786b574-daa5-4673-aa0c-cbe3e8534c02", name: "Katie", desc: "Expressive & clear" }
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVoiceId(v.id);
                        setVoicePanelOpen(false);
                      }}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        selectedVoiceId === v.id
                          ? "bg-indigo-600/10 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                          : "bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold">{v.name}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{v.desc}</p>
                      </div>
                      {selectedVoiceId === v.id && (
                        <Check className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Male Voices Section */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Realistic Male Voices</p>
                <div className="space-y-2.5">
                  {[
                    { id: "a5136bf9-224c-4d76-b823-52bd5efcffcc", name: "Jameson", desc: "Deep & natural" },
                    { id: "ef191366-f52f-447a-a398-ed8c0f2943a1", name: "Archie", desc: "Friendly & professional" }
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVoiceId(v.id);
                        setVoicePanelOpen(false);
                      }}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        selectedVoiceId === v.id
                          ? "bg-indigo-600/10 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                          : "bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold">{v.name}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{v.desc}</p>
                      </div>
                      {selectedVoiceId === v.id && (
                        <Check className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer feedback */}
            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-[9px] text-white/30 font-medium">Select a voice to apply it to the next response.</p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
