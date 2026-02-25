"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Phone, Sparkles, Users, Code2, Lightbulb, Mic2 } from "lucide-react";
import {
  startInterviewSession,
  endInterviewSession,
} from "@/src/lib/actions/interview-sessions";
import { toast } from "@/src/lib/toast";

/** Downsample float audio from srcRate to dstRate using linear interpolation */
function resample(
  input: Float32Array,
  srcRate: number,
  dstRate: number
): Float32Array {
  const ratio = srcRate / dstRate;
  const outLen = Math.floor(input.length / ratio);
  const output = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcIdx = i * ratio;
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, input.length - 1);
    const frac = srcIdx - lo;
    output[i] = input[lo] * (1 - frac) + input[hi] * frac;
  }
  return output;
}

const SESSION_TYPE_META: Record<
  string,
  { label: string; icon: React.ElementType; tagline: string }
> = {
  behavioral: {
    label: "Behavioral Interview",
    icon: Users,
    tagline: "Use the STAR method to discuss your experiences.",
  },
  technical: {
    label: "Technical Interview",
    icon: Code2,
    tagline: "Solve problems, explain systems, and demonstrate technical depth.",
  },
  situational: {
    label: "Situational Interview",
    icon: Lightbulb,
    tagline: "Walk through how you'd handle on-the-job scenarios.",
  },
  general: {
    label: "General Interview",
    icon: Mic2,
    tagline: "Open-ended practice across all interview dimensions.",
  },
};

interface ElevenLabsInterviewRoomProps {
  agentId: string;
  sessionType: string;
}

export function ElevenLabsInterviewRoom({
  agentId,
  sessionType,
}: ElevenLabsInterviewRoomProps) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  const sessionIdRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();
  const meta = SESSION_TYPE_META[sessionType] ?? SESSION_TYPE_META.general;
  const Icon = meta.icon;

  const handleStart = useCallback(async () => {
    if (isStarting || isConnected) return;
    setIsStarting(true);

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create interview session in database
      const sessionId = await startInterviewSession(sessionType);
      sessionIdRef.current = sessionId;

      // Get signed URL from backend
      const response = await fetch("/api/elevenlabs-signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get signed URL");
      }

      const { signedUrl } = await response.json();

      // Initialize WebSocket connection
      const websocket = new WebSocket(signedUrl);

      websocket.onopen = async () => {
        console.log("✅ Connected to ElevenLabs");
        setIsConnected(true);
        setWs(websocket);

        // Set up Web Audio API to capture PCM audio at 16kHz
        // Use default sample rate if 16kHz not supported (some devices restrict)
        let audioContext: AudioContext;
        try {
          audioContext = new AudioContext({ sampleRate: 16000 });
        } catch {
          audioContext = new AudioContext();
        }
        audioContextRef.current = audioContext;

        // Resume if suspended (Chrome requires user gesture - we're inside click handler)
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        // Load AudioWorklet processor (replaces deprecated ScriptProcessorNode)
        await audioContext.audioWorklet.addModule("/pcm-capture-processor.js");

        const source = audioContext.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(audioContext, "pcm-capture-processor", {
          numberOfInputs: 1,
          numberOfOutputs: 1,
        });

        const inputSampleRate = audioContext.sampleRate;
        const targetSampleRate = 16000;
        const needsResample = inputSampleRate !== targetSampleRate;

        workletNode.port.onmessage = (e: MessageEvent<{ audio: Float32Array }>) => {
          if (websocket.readyState !== WebSocket.OPEN) return;

          let floatData = e.data.audio;
          if (needsResample && inputSampleRate > targetSampleRate) {
            floatData = resample(floatData, inputSampleRate, targetSampleRate);
          }

          // Convert Float32Array to Int16Array (PCM 16-bit)
          const pcmData = new Int16Array(floatData.length);
          for (let i = 0; i < floatData.length; i++) {
            const s = Math.max(-1, Math.min(1, floatData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          const base64 = btoa(
            String.fromCharCode(...new Uint8Array(pcmData.buffer))
          );

          // ElevenLabs expects user_audio_chunk with base64 PCM at 16kHz
          websocket.send(
            JSON.stringify({
              user_audio_chunk: base64,
              sample_rate: targetSampleRate,
            })
          );
        };

        source.connect(workletNode);
        workletNode.connect(audioContext.destination);

        toast.success("Interview started! Sarah is ready to talk.");
      };

      websocket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle agent audio: ElevenLabs sends { type: "audio", audio_event: { audio_base_64: "..." } }
          const audioBase64 =
            message.audio_event?.audio_base_64 ?? message.audio?.chunk;
          if (audioBase64) {
            const audioContext = audioContextRef.current;
            if (!audioContext || audioContext.state === "closed") return;

            try {
              const binaryString = atob(audioBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const pcmData = new Int16Array(bytes.buffer);

              const float32Data = new Float32Array(pcmData.length);
              for (let i = 0; i < pcmData.length; i++) {
                float32Data[i] =
                  pcmData[i] / (pcmData[i] < 0 ? 0x8000 : 0x7fff);
              }

              // ElevenLabs agent output format is pcm_44100 per conversation_initiation_metadata
              const sampleRate = 44100;
              const audioBuffer = audioContext.createBuffer(
                1,
                float32Data.length,
                sampleRate
              );
              audioBuffer.getChannelData(0).set(float32Data);

              const source = audioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContext.destination);
              source.start(0);
            } catch (e) {
              console.warn("Failed to play agent audio:", e);
            }
          }

          // Handle agent transcript from agent_response_event
          const agentText =
            message.agent_response_event?.agent_response ??
            message.transcript ??
            message.message;
          if (agentText && typeof agentText === "string") {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", text: agentText },
            ]);
          }

          // Handle user transcript from user_transcription_event
          const userText = message.user_transcription_event?.user_transcript;
          if (userText && typeof userText === "string") {
            setMessages((prev) => [...prev, { role: "user", text: userText }]);
          }

          // Respond to server ping to keep connection alive
          if (message.type === "ping") {
            websocket.send(JSON.stringify({ type: "pong" }));
            return;
          }

          // Log non-ping messages for debugging
          console.log("📩 ElevenLabs message:", message);
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };

      websocket.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        toast.error("Connection error occurred");
      };

      websocket.onclose = () => {
        console.log("🔌 WebSocket closed");
        handleEnd();
      };
    } catch (err) {
      console.error("Failed to start interview:", err);
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setIsStarting(false);
    }
  }, [agentId, sessionType, isConnected, isStarting]);

  const handleEnd = useCallback(async () => {
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    setWs(null);
    setIsConnected(false);

    // Close audio context (check state to avoid "Cannot close a closed AudioContext")
    const ctx = audioContextRef.current;
    if (ctx && ctx.state !== "closed") {
      await ctx.close();
    }
    audioContextRef.current = null;

    // End database session
    if (sessionIdRef.current) {
      try {
        await endInterviewSession(sessionIdRef.current);
        setSessionEnded(true);
        toast.success("Interview ended");
      } catch (error) {
        console.error("Failed to end session:", error);
      }
    }
  }, [ws]);

  const toggleMute = useCallback(() => {
    if (!streamRef.current) return;

    const newMuted = !isMuted;
    streamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !newMuted; // enabled=false when muted
    });
    setIsMuted(newMuted);
    toast(newMuted ? "Microphone muted" : "Microphone unmuted");
  }, [isMuted]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== "closed") {
        ctx.close();
      }
      audioContextRef.current = null;
    };
  }, [ws]);

  if (sessionEnded) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex size-20 items-center justify-center rounded-full bg-green-500/10"
        >
          <Sparkles className="size-10 text-green-600" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold">Interview Complete!</h2>
          <p className="mt-2 text-muted-foreground">
            Great job! Your session has been saved.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/interviews")}
          className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          View All Sessions
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">{meta.label}</h2>
            <p className="text-xs text-muted-foreground">{meta.tagline}</p>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <div className="size-2 animate-pulse rounded-full bg-green-600" />
              Live
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
              <Icon className="size-12 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Ready to practice?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Click start to begin your interview with Sarah
              </p>
            </div>
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {isStarting ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mic className="size-5" />
                  Start Interview
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <div className="flex w-full max-w-2xl flex-col gap-6">
            {/* Transcript */}
            <div className="flex-1 space-y-4 rounded-lg border border-border bg-card p-6">
              <h4 className="font-semibold">Conversation</h4>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Listening... Speak to start the conversation.
                  </p>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-3 text-sm ${
                        msg.role === "user"
                          ? "bg-primary/10 text-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className="font-semibold">
                        {msg.role === "user" ? "You" : "Sarah"}:
                      </span>{" "}
                      {msg.text}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleMute}
                className={`flex size-14 items-center justify-center rounded-full border-2 transition-all ${
                  isMuted
                    ? "border-red-500 bg-red-500/10 text-red-600 hover:bg-red-500/20"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                {isMuted ? (
                  <MicOff className="size-6" />
                ) : (
                  <Mic className="size-6" />
                )}
              </button>
              <button
                onClick={handleEnd}
                className="flex size-14 items-center justify-center rounded-full bg-red-500 text-white transition-all hover:bg-red-600"
              >
                <Phone className="size-6 rotate-135" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
