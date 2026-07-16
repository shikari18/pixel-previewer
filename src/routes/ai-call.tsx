import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Mic, MicOff, Video, PhoneOff, Sliders, X, Check, Volume2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import aiSphereImg from "@/assets/my-ai.png";

export const generateSpeechFn = createServerFn("POST", async ({ data, voiceId }: { data: string; voiceId: string }) => {
  try {
    const apiKey = process.env.VITE_CARTESIA_API_KEY || process.env.CARTESIA_API_KEY || "sk_car_GW1Vfb53x362GSeYoEKV4f";
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

// Pick the best female voice available (fallback SpeechSynthesis)
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
  const [status, setStatus] = useState<"ringing" | "greeting" | "listening" | "thinking" | "speaking" | "idle">("ringing");
  const [micError, setMicError] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("db6b0ed5-d5d3-463d-ae85-518a07d3c2b4");
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef<any>(null);
  const mutedRef = useRef(false); // track mute in callback without stale closure
  const listeningRef = useRef(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringingAudioRef = useRef<{ stop: () => void } | null>(null);
  
  // Video and stream references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Ringing oscillator sound creator (runs for 5 seconds on mount)
  const startRingingAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      
      const playTone = () => {
        if (ctx.state === "suspended") {
          ctx.resume();
        }
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime + 1.6);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        
        osc1.stop(ctx.currentTime + 1.8);
        osc2.stop(ctx.currentTime + 1.8);
      };

      // Play immediately
      playTone();
      const interval = setInterval(playTone, 2500);
      
      return {
        stop: () => {
          clearInterval(interval);
          ctx.close().catch(() => {});
        }
      };
    } catch (e) {
      console.warn("Failed to play ringing tone:", e);
      return null;
    }
  };

  // Call Duration Timer (only runs once call connects)
  useEffect(() => {
    if (status === "ringing") return;
    const iv = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(iv);
  }, [status]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // Web Speech synthesis fallback
  const fallbackSpeak = useCallback((text: string, onDone?: () => void) => {
    let isDoneTriggered = false;
    const triggerDone = () => {
      if (isDoneTriggered) return;
      isDoneTriggered = true;
      setIsSpeaking(false);
      onDone?.();
    };

    const wordCount = text.split(/\s+/).length;
    const safetyTimeoutMs = Math.max(3000, (wordCount * 500) + 3000);
    const safetyTimer = setTimeout(() => {
      console.warn("SpeechSynthesis safety timeout hit. Cancelling speech.");
      synthRef.current.cancel();
      triggerDone();
    }, safetyTimeoutMs);

    const trySpeak = () => {
      synthRef.current.cancel(); 
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

  // Primary speech controller (Cartesia)
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

  // Continuous speech recognition loop (eliminates iPhone toggling bug)
  const startListening = useCallback(() => {
    if (mutedRef.current || listeningRef.current || micError) return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = async (e: any) => {
      const text = e.results[e.results.length - 1][0].transcript;
      setTranscript(text);
      
      // Mute mic recognition session temporarily so AI output isn't heard
      recognition.stop();
      setIsListening(false);
      listeningRef.current = false;
      
      setStatus("thinking");
      await getAiResponse(text);
    };

    recognition.onerror = (e: any) => {
      if (e.error === "not-allowed") {
        setMicError("Microphone access denied");
        setIsListening(false);
        listeningRef.current = false;
        setStatus("idle");
        return;
      }
      // Silently ignore other errors (like no-speech) to prevent mic toggles
      console.log("Speech recognition error:", e.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      listeningRef.current = false;
      // Auto-restart if we are in listening mode and unmuted
      if (!mutedRef.current && status === "listening") {
        setTimeout(startListening, 600);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    listeningRef.current = true;
    setStatus("listening");
  }, [micError, status]);

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
        setStatus("listening");
      });
    } catch {
      const err = "I had trouble connecting. Please try again.";
      setAiText(err);
      speakText(err, () => {
        setStatus("listening");
      });
    }
  };

  // Video feed sharing toggle
  const toggleCamera = async () => {
    if (isCameraOn) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } } // Ideal for showing workspace / books
        });
        streamRef.current = stream;
        setIsCameraOn(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 150);
      } catch (err) {
        console.error("Camera access failed:", err);
        alert("Unable to open camera. Please verify permissions.");
      }
    }
  };

  // On mount: play ring tone for exactly 5 seconds, then pick up and connect
  useEffect(() => {
    setStatus("ringing");
    const ringing = startRingingAudio();
    ringingAudioRef.current = ringing;

    const connectTimeout = setTimeout(() => {
      if (ringingAudioRef.current) {
        ringingAudioRef.current.stop();
        ringingAudioRef.current = null;
      }
      
      setStatus("greeting");
      const greeting = "Hi! I'm Mr. Simon. What would you like to study today?";
      speakText(greeting, () => {
        setStatus("listening");
      });
    }, 5000);

    return () => {
      clearTimeout(connectTimeout);
      if (ringingAudioRef.current) {
        ringingAudioRef.current.stop();
        ringingAudioRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Sync listening state with status changes
  useEffect(() => {
    if (status === "listening" && !isSpeaking && !isMuted) {
      startListening();
    }
  }, [status, isSpeaking, isMuted, startListening]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    mutedRef.current = newMuted;
    if (newMuted) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      listeningRef.current = false;
    } else {
      if (status === "listening" && !isSpeaking) {
        setTimeout(startListening, 300);
      }
    }
  };

  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
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
    if (status === "ringing") return "Ringing...";
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
          <p className="text-sm font-mono text-white/50">{status === "ringing" ? "00:00" : formatDuration(callDuration)}</p>
        </div>

        {/* Center: avatar + status */}
        <div className="flex flex-col items-center gap-5">
          {/* Avatar with pulse ring when speaking or ringing */}
          <div className="relative">
            {(isSpeaking || status === "ringing") && (
              <>
                <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400/15 scale-110" />
                <div className="absolute inset-0 rounded-full animate-pulse bg-indigo-400/10 scale-125" />
              </>
            )}
            <div className={`rounded-full transition-all duration-300 ${isSpeaking || status === "ringing" ? "ring-2 ring-indigo-400/60 ring-offset-4 ring-offset-black" : ""}`}>
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
              status === "ringing" ? "text-indigo-300 animate-pulse" :
              isMuted ? "text-red-400" :
              "text-white/40"
            }`}>
              {statusLabel()}
            </p>
          </div>

          {/* AI last response */}
          <div className="max-w-[280px] text-center min-h-[60px] flex items-center justify-center">
            <p className="text-sm text-white/55 leading-relaxed italic">
              {status === "ringing" ? "Calling AI Tutor..." : `"${aiText}"`}
            </p>
          </div>

          {/* User last said */}
          {transcript && status !== "ringing" && (
            <p className="text-xs text-white/25 text-center max-w-[240px]">You: "{transcript}"</p>
          )}
        </div>

        {/* Floating Video Share View (Picture in Picture) */}
        {isCameraOn && (
          <div className="absolute bottom-32 right-6 w-32 h-44 rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl z-30 animate-in fade-in duration-200">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[8px] text-white font-bold uppercase tracking-wider">
              Share View
            </div>
          </div>
        )}

        {/* Bottom: controls */}
        <div className="flex items-end justify-center gap-10">

          {/* Video Share Button */}
          <button className="flex flex-col items-center gap-2" onClick={toggleCamera}>
            <div className={`h-14 w-14 rounded-full border flex items-center justify-center active:scale-95 transition-all ${
              isCameraOn
                ? "bg-indigo-600/20 border-indigo-400/40"
                : "bg-white/[0.08] border-white/10"
            }`}>
              <Video className={`h-6 w-6 ${isCameraOn ? "text-indigo-400" : "text-white/60"}`} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] text-white/35">{isCameraOn ? "Camera Off" : "Video"}</span>
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

        {/* Centered Glassmorphism Voice Selector Modal */}
        {voicePanelOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-zinc-900/95 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-5">
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
              <div className="space-y-5 max-h-[300px] overflow-y-auto pr-1 select-none [&::-webkit-scrollbar]:hidden">
                
                {/* Female Section */}
                <div>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2.5">Realistic Female Voices</p>
                  <div className="space-y-2">
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
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          selectedVoiceId === v.id
                            ? "bg-indigo-600/10 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.08)]"
                            : "bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold">{v.name}</p>
                          <p className="text-[9px] text-white/40 mt-0.5">{v.desc}</p>
                        </div>
                        {selectedVoiceId === v.id && (
                          <Check className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Male Section */}
                <div>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2.5">Realistic Male Voices</p>
                  <div className="space-y-2">
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
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          selectedVoiceId === v.id
                            ? "bg-indigo-600/10 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.08)]"
                            : "bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold">{v.name}</p>
                          <p className="text-[9px] text-white/40 mt-0.5">{v.desc}</p>
                        </div>
                        {selectedVoiceId === v.id && (
                          <Check className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Close Button */}
              <button
                onClick={() => setVoicePanelOpen(false)}
                className="mt-5 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] transition-all text-white font-semibold text-xs rounded-xl"
              >
                Close
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
