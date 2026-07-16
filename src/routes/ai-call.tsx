import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Mic, MicOff, Video, PhoneOff, Sliders } from "lucide-react";
import { useState, useEffect, useRef, useCallback, Component, ReactNode } from "react";
import aiSphereImg from "@/assets/my-ai.png";

class LocalErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("LocalErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-zinc-950 text-red-400 p-6 overflow-auto font-mono text-xs flex flex-col gap-4 z-50">
          <h2 className="text-lg font-bold text-red-500">Render Error Caught</h2>
          <p className="font-semibold">{this.state.error?.message}</p>
          <pre className="bg-zinc-900 p-4 rounded border border-red-500/20 whitespace-pre-wrap overflow-auto max-h-[300px]">
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded font-bold hover:bg-zinc-700 w-fit"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const VOICES = [
  { id: "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4", name: "Skylar", desc: "Female · Warm & conversational" },
  { id: "f786b574-daa5-4673-aa0c-cbe3e8534c02", name: "Katie",  desc: "Female · Expressive & clear" },
  { id: "a5136bf9-224c-4d76-b823-52bd5efcffcc", name: "Jameson", desc: "Male · Deep & natural" },
  { id: "ef191366-f52f-447a-a398-ed8c0f2943a1", name: "Archie", desc: "Male · Friendly & professional" },
];

export const generateSpeechFn = createServerFn("POST", async ({ data, voiceId }: { data: string; voiceId: string }) => {
  try {
    const apiKey = process.env.VITE_CARTESIA_API_KEY || process.env.CARTESIA_API_KEY || "sk_car_BpbMPNrmU7RVMoWQ9T4k3A";
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
        voice: { mode: "id", id: voiceId },
        output_format: { container: "mp3", bit_rate: 128000, sample_rate: 44100 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cartesia API failed: ${response.statusText} — ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  } catch (err) {
    console.error("Cartesia TTS error:", err);
    throw err;
  }
});

export const Route = createFileRoute("/ai-call")({
  head: () => ({ meta: [{ title: "AI Tutor Call — The Flow" }] }),
  component: () => (
    <LocalErrorBoundary>
      <AiCallPage />
    </LocalErrorBoundary>
  ),
});

function getBestFallbackVoice(synth: SpeechSynthesis | null): SpeechSynthesisVoice | null {
  if (!synth) return null;
  const voices = synth.getVoices();
  const preferred = ["Samantha", "Karen", "Moira", "Tessa", "Google UK English Female", "Google US English"];
  for (const name of preferred) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }
  return voices.find(v => v.lang.startsWith("en")) || null;
}

// Play base64 mp3 safely — returns cleanup fn
function playBase64Audio(
  base64: string,
  onEnded: () => void,
  onError: () => void
): { audio: HTMLAudioElement; cleanup: () => void } {
  // Decode base64 → Uint8Array → Blob → object URL (avoids iOS data: URL issues)
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => { URL.revokeObjectURL(url); onEnded(); };
  audio.onerror = () => { URL.revokeObjectURL(url); onError(); };
  audio.play().catch(onError);
  return {
    audio,
    cleanup: () => {
      audio.pause();
      URL.revokeObjectURL(url);
    },
  };
}

function AiCallPage() {
  const navigate = useNavigate();

  const [isMuted,       setIsMuted]       = useState(false);
  const [isListening,   setIsListening]   = useState(false);
  const [isSpeaking,    setIsSpeaking]    = useState(false);
  const [callDuration,  setCallDuration]  = useState(0);
  const [transcript,    setTranscript]    = useState("");
  const [aiText,        setAiText]        = useState("Hi! I'm Mr. Simon. What would you like to study today?");
  const [status,        setStatus]        = useState<"ringing"|"greeting"|"listening"|"thinking"|"speaking"|"idle">("ringing");
  const [micError,      setMicError]      = useState<string | null>(null);
  const [voiceId,       setVoiceId]       = useState(VOICES[0].id);
  const [sheetOpen,     setSheetOpen]     = useState(false);
  const [isCameraOn,    setIsCameraOn]    = useState(false);

  const synthRef        = useRef<SpeechSynthesis | null>(null);
  const recognitionRef  = useRef<any>(null);
  const mutedRef        = useRef(false);
  const listeningRef    = useRef(false);
  const audioCleanupRef = useRef<(() => void) | null>(null);
  const ringingRef      = useRef<{ stop: () => void } | null>(null);
  const videoRef        = useRef<HTMLVideoElement | null>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const voiceIdRef      = useRef(voiceId);

  // Initialize browser-only refs once on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Keep voiceIdRef in sync so callbacks always read the latest value
  useEffect(() => { voiceIdRef.current = voiceId; }, [voiceId]);

  // ─── Ringing oscillator ──────────────────────────────────────────────────
  function startRingingAudio() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      const playBurst = () => {
        if (ctx.state === "suspended") ctx.resume();
        [440, 480].forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.07, ctx.currentTime + 1.5);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.7);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.7);
        });
      };
      playBurst();
      const iv = setInterval(playBurst, 2500);
      return { stop: () => { clearInterval(iv); ctx.close().catch(() => {}); } };
    } catch { return null; }
  }

  // ─── Call timer (only after ringing ends) ───────────────────────────────
  useEffect(() => {
    if (status === "ringing") return;
    const iv = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(iv);
  }, [status]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  // ─── Fallback: browser SpeechSynthesis ──────────────────────────────────
  const fallbackSpeak = useCallback((text: string, onDone?: () => void) => {
    let fired = false;
    const done = () => { if (fired) return; fired = true; setIsSpeaking(false); onDone?.(); };
    const wordCount = text.split(/\s+/).length;
    const timer = setTimeout(() => { synthRef.current?.cancel(); done(); }, Math.max(4000, wordCount * 550 + 3000));
    const speak = () => {
      if (!synthRef.current) { done(); return; }
      synthRef.current?.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      const voice = getBestFallbackVoice(synthRef.current);
      if (voice) utt.voice = voice;
      utt.rate = 0.92; utt.pitch = 1.05; utt.volume = 1;
      utt.onstart = () => { setIsSpeaking(true); setStatus("speaking"); };
      utt.onend   = () => { clearTimeout(timer); done(); };
      utt.onerror = () => { clearTimeout(timer); done(); };
      synthRef.current.speak(utt);
    };
    if (!synthRef.current || synthRef.current.getVoices().length === 0) {
      if (typeof window !== "undefined") window.speechSynthesis.onvoiceschanged = speak;
      else done();
    } else {
      speak();
    }
  }, []);

  // ─── Primary: Cartesia via server fn ────────────────────────────────────
  const speakText = useCallback(async (text: string, onDone?: () => void, overrideVoiceId?: string) => {
    // Stop any current audio
    audioCleanupRef.current?.();
    audioCleanupRef.current = null;
    synthRef.current?.cancel();

    setIsSpeaking(true);
    setStatus("speaking");

    let fired = false;
    const done = () => { if (fired) return; fired = true; setIsSpeaking(false); onDone?.(); };

    const wordCount = text.split(/\s+/).length;
    const safety = setTimeout(() => {
      audioCleanupRef.current?.();
      audioCleanupRef.current = null;
      done();
    }, Math.max(5000, wordCount * 600 + 4000));

    try {
      const base64 = await generateSpeechFn({ data: text, voiceId: overrideVoiceId ?? voiceIdRef.current });
      const { cleanup } = playBase64Audio(
        base64,
        () => { clearTimeout(safety); done(); },
        () => { clearTimeout(safety); fallbackSpeak(text, done); }
      );
      audioCleanupRef.current = cleanup;
    } catch {
      clearTimeout(safety);
      fallbackSpeak(text, done);
    }
  }, [fallbackSpeak]);

  // ─── Speech Recognition ─────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (mutedRef.current || listeningRef.current || micError) return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.continuous      = true;
    rec.interimResults  = false;
    rec.lang            = "en-US";

    rec.onresult = async (e: any) => {
      const text = e.results[e.results.length - 1][0].transcript;
      setTranscript(text);
      rec.stop();
      setIsListening(false);
      listeningRef.current = false;
      setStatus("thinking");
      await getAiResponse(text);
    };

    rec.onerror = (e: any) => {
      if (e.error === "not-allowed") {
        setMicError("Microphone access denied");
        setIsListening(false);
        listeningRef.current = false;
        setStatus("idle");
      }
      // Ignore transient errors (no-speech, aborted) — they won't restart
    };

    rec.onend = () => {
      setIsListening(false);
      listeningRef.current = false;
    };

    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
    listeningRef.current = true;
    setStatus("listening");
  }, [micError]); // eslint-disable-line

  // ─── AI response ────────────────────────────────────────────────────────
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
              content: "You are Mr. Simon, a warm, knowledgeable AI Tutor on a voice call. Keep responses SHORT — 2-3 sentences max. Do NOT use bullet points, markdown, or motivational sign-offs. Always end with a concise, contextual quiz question or follow-up based on what was just discussed. If the student is wrong, re-explain simply and ask a simpler version. If correct, affirm briefly and advance the topic with a new question.",
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
      speakText(reply, () => setStatus("listening"));
    } catch {
      const err = "I had trouble connecting. Please try again.";
      setAiText(err);
      speakText(err, () => setStatus("listening"));
    }
  };

  // ─── Camera toggle ───────────────────────────────────────────────────────
  const toggleCamera = async () => {
    if (isCameraOn) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        streamRef.current = stream;
        setIsCameraOn(true);
        setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
      } catch { alert("Unable to access camera. Please check permissions."); }
    }
  };

  // ─── Mount: ring for 5 s while pre-warming greeting audio ───────────────
  useEffect(() => {
    const ringing = startRingingAudio();
    ringingRef.current = ringing;

    const GREETING = "Hi! I'm Mr. Simon. What would you like to study today?";

    // Pre-fetch greeting audio in the background during the 5-second ring
    let greetingBase64: string | null = null;
    generateSpeechFn({ data: GREETING, voiceId: voiceIdRef.current })
      .then(b64 => { greetingBase64 = b64; })
      .catch(() => {}); // fallback will handle if this fails

    const connectTimer = setTimeout(() => {
      ringingRef.current?.stop();
      ringingRef.current = null;

      setStatus("greeting");
      setIsSpeaking(true);

      let fired = false;
      const done = () => { if (fired) return; fired = true; setIsSpeaking(false); setStatus("listening"); };

      const wordCount = GREETING.split(/\s+/).length;
      const safety = setTimeout(done, Math.max(5000, wordCount * 600 + 4000));

      const play = () => {
        if (greetingBase64) {
          const { cleanup } = playBase64Audio(
            greetingBase64,
            () => { clearTimeout(safety); done(); },
            () => { clearTimeout(safety); fallbackSpeak(GREETING, done); }
          );
          audioCleanupRef.current = cleanup;
        } else {
          clearTimeout(safety);
          fallbackSpeak(GREETING, done);
        }
      };

      play();
    }, 5000);

    return () => {
      clearTimeout(connectTimer);
      ringingRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCleanupRef.current?.();
      synthRef.current?.cancel();
      recognitionRef.current?.stop();
    };
  }, []); // eslint-disable-line

  // ─── Auto-start listening when status switches to "listening" ────────────
  useEffect(() => {
    if (status === "listening" && !isSpeaking && !isMuted) {
      startListening();
    }
  }, [status, isSpeaking, isMuted, startListening]);

  // ─── Mute / unmute ───────────────────────────────────────────────────────
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    mutedRef.current = next;
    if (next) {
      recognitionRef.current?.stop();
      setIsListening(false);
      listeningRef.current = false;
    } else if (status === "listening" && !isSpeaking) {
      setTimeout(startListening, 300);
    }
  };

  // ─── End call ────────────────────────────────────────────────────────────
  const endCall = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCleanupRef.current?.();
    synthRef.current?.cancel();
    recognitionRef.current?.stop();
    navigate({ to: "/chat" });
  };

  const statusLabel = () => {
    const SR = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SR)          return "Voice input unsupported";
    if (micError)     return micError;
    if (isMuted)      return "Muted";
    if (status === "ringing")   return "Calling...";
    if (status === "listening") return "Listening...";
    if (status === "thinking")  return "Thinking...";
    if (status === "speaking" || status === "greeting") return "Speaking...";
    return "Connected";
  };

  const selectedVoice = VOICES.find(v => v.id === voiceId) ?? VOICES[0];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black text-white flex overflow-hidden">
      <div className="relative w-full h-full flex flex-col items-center justify-between py-16 px-8">

        {/* Voice picker toggle — top-right */}
        <button
          onClick={() => setSheetOpen(true)}
          className="absolute top-6 right-6 z-40 flex items-center gap-1.5 px-3 h-9 rounded-full bg-white/[0.06] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all text-xs font-medium"
          aria-label="Change voice"
        >
          <Sliders className="h-3.5 w-3.5" />
          {selectedVoice.name}
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-xs text-white/40 font-medium tracking-widest uppercase">AI Tutor · Voice Call</p>
          <p className="text-sm font-mono text-white/50">{status === "ringing" ? "00:00" : formatDuration(callDuration)}</p>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            {(isSpeaking || status === "ringing") && (
              <>
                <div className="absolute inset-0 rounded-full animate-ping  bg-indigo-400/12 scale-110" />
                <div className="absolute inset-0 rounded-full animate-pulse bg-indigo-400/8  scale-125" />
              </>
            )}
            <div className={`rounded-full transition-all duration-300 ${isSpeaking || status === "ringing" ? "ring-2 ring-indigo-400/60 ring-offset-4 ring-offset-black" : ""}`}>
              <img src={aiSphereImg} alt="Mr. Simon" className="w-44 h-44 rounded-full object-cover" />
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xl font-semibold text-white">Mr. Simon</p>
            <p className={`text-xs font-medium transition-colors ${
              status === "ringing"   ? "text-indigo-300 animate-pulse" :
              status === "listening" ? "text-emerald-400" :
              status === "thinking"  ? "text-amber-400" :
              (status === "speaking" || status === "greeting") ? "text-indigo-400" :
              isMuted                ? "text-red-400" :
              "text-white/40"
            }`}>
              {statusLabel()}
            </p>
          </div>

          <div className="max-w-[280px] text-center min-h-[60px] flex items-center justify-center">
            <p className="text-sm text-white/50 leading-relaxed italic">
              {status === "ringing" ? "Connecting your AI tutor..." : `"${aiText}"`}
            </p>
          </div>

          {transcript && status !== "ringing" && (
            <p className="text-xs text-white/25 text-center max-w-[240px]">You: "{transcript}"</p>
          )}
        </div>

        {/* Picture-in-picture camera */}
        {isCameraOn && (
          <div className="absolute bottom-32 right-5 w-28 h-40 rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl z-30 animate-in fade-in duration-200">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[7px] text-white font-bold uppercase tracking-wider">Your View</div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-end justify-center gap-10">
          <button className="flex flex-col items-center gap-2" onClick={toggleCamera}>
            <div className={`h-14 w-14 rounded-full border flex items-center justify-center active:scale-95 transition-all ${isCameraOn ? "bg-indigo-600/20 border-indigo-400/40" : "bg-white/[0.08] border-white/10"}`}>
              <Video className={`h-6 w-6 ${isCameraOn ? "text-indigo-400" : "text-white/60"}`} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] text-white/35">{isCameraOn ? "Camera Off" : "Video"}</span>
          </button>

          <button onClick={endCall} className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-400 active:scale-95 transition-all shadow-[0_4px_24px_rgba(239,68,68,0.4)]">
              <PhoneOff className="h-7 w-7 text-white" strokeWidth={2} />
            </div>
            <span className="text-[10px] text-white/35">End</span>
          </button>

          <button onClick={toggleMute} className="flex flex-col items-center gap-2">
            <div className={`h-14 w-14 rounded-full border flex items-center justify-center active:scale-95 transition-all ${isMuted ? "bg-red-500/20 border-red-500/40" : isListening ? "bg-emerald-500/20 border-emerald-400/40" : "bg-white/[0.08] border-white/10"}`}>
              {isMuted
                ? <MicOff className="h-6 w-6 text-red-400" strokeWidth={1.8} />
                : <Mic className={`h-6 w-6 ${isListening ? "text-emerald-400" : "text-white/60"}`} strokeWidth={1.8} />
              }
            </div>
            <span className="text-[10px] text-white/35">{isMuted ? "Unmute" : "Mute"}</span>
          </button>
        </div>

        {/* ── Apple-style Action Sheet ────────────────────────────────────── */}
        {sheetOpen && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setSheetOpen(false)}
          >
            {/* Sheet container — stop propagation so clicking inside doesn't close */}
            <div
              className="w-full px-4 pb-6 animate-in slide-in-from-bottom duration-300"
              onClick={e => e.stopPropagation()}
            >
              {/* Voice list card */}
              <div className="rounded-2xl overflow-hidden bg-[#1c1c1e]/95 backdrop-blur-xl mb-3">
                {/* Title */}
                <div className="px-4 pt-4 pb-2">
                  <p className="text-[11px] text-center text-white/40 font-medium">Select Voice</p>
                </div>

                {VOICES.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => { setVoiceId(v.id); setSheetOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors active:bg-white/[0.06] ${i !== 0 ? "border-t border-white/[0.07]" : ""}`}
                  >
                    <div>
                      <p className={`text-[15px] font-medium ${voiceId === v.id ? "text-indigo-400" : "text-white"}`}>{v.name}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">{v.desc}</p>
                    </div>
                    {voiceId === v.id && (
                      <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Cancel button — separate card like native iOS */}
              <button
                onClick={() => setSheetOpen(false)}
                className="w-full rounded-2xl bg-[#1c1c1e]/95 backdrop-blur-xl py-4 text-[17px] font-semibold text-indigo-400 active:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
