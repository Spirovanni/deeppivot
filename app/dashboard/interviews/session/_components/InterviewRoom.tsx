"use client";

import { VoiceProvider } from "@humeai/voice-react";
import Messages from "@/components/Messages";
import Controls from "@/components/Controls";
import { ComponentRef, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mic2, Code2, Users, Lightbulb, Sparkles, Phone } from "lucide-react";
import {
  startInterviewSession,
  endInterviewSession,
  captureEmotionSnapshot,
} from "@/src/lib/actions/interview-sessions";
import { toast } from "@/src/lib/toast";
import { useVoice } from "@humeai/voice-react";

const SESSION_TYPE_META: Record<string, { label: string; icon: React.ElementType; tagline: string }> = {
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

// ─── Emotion capture hook (must live inside VoiceProvider) ───────────────────

function EmotionCapture({ sessionId }: { sessionId: number | null }) {
  const { messages } = useVoice();
  const lastCaptureAt = useRef(0);
  const processedCount = useRef(0);

  useEffect(() => {
    if (!sessionId) return;

    const newMessages = messages.slice(processedCount.current);
    processedCount.current = messages.length;

    const now = Date.now();
    if (now - lastCaptureAt.current < 5_000) return;

    for (const msg of newMessages) {
      if (msg.type === "user_message" || msg.type === "assistant_message") {
        const scores = msg.models?.prosody?.scores as Record<string, number> | undefined;
        if (scores && Object.keys(scores).length > 0) {
          lastCaptureAt.current = now;
          captureEmotionSnapshot(sessionId, scores).catch(console.error);
          break;
        }
      }
    }
  }, [messages, sessionId]);

  return null;
}

// ─── Session lifecycle hook (must live inside VoiceProvider) ─────────────────

function SessionLifecycle({
  sessionId,
  onSessionEnd,
}: {
  sessionId: number | null;
  onSessionEnd: (score: number | null) => void;
}) {
  const { status } = useVoice();
  const prevStatus = useRef(status.value);

  useEffect(() => {
    if (prevStatus.current === "connected" && status.value === "disconnected" && sessionId) {
      endInterviewSession(sessionId)
        .then(({ overallScore }) => onSessionEnd(overallScore))
        .catch((err) => {
          console.error("Failed to end session:", err);
          onSessionEnd(null);
        });
    }
    prevStatus.current = status.value;
  }, [status.value, sessionId, onSessionEnd]);

  return null;
}

// ─── Start button (must live inside VoiceProvider) ───────────────────────────

function InterviewStartButton({
  sessionType,
  accessToken,
  onSessionCreated,
}: {
  sessionType: string;
  accessToken: string;
  onSessionCreated: (id: number) => void;
}) {
  const { status, connect } = useVoice();
  const [isStarting, setIsStarting] = useState(false);
  const meta = SESSION_TYPE_META[sessionType] ?? SESSION_TYPE_META.general;
  const Icon = meta.icon;

  const handleStart = async () => {
    if (isStarting || status.value === "connected") return;
    setIsStarting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionId = await startInterviewSession(sessionType);
      onSessionCreated(sessionId);
      await connect({
        auth: { type: "accessToken", value: accessToken },
        configId: process.env.NEXT_PUBLIC_HUME_CONFIG_ID,
      });
    } catch (err) {
      console.error("Failed to start interview:", err);
      if (err instanceof Error) alert(err.message);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <AnimatePresence>
      {status.value !== "connected" && (
        <motion.div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 bg-background/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <Icon className="size-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{meta.label}</h2>
            <p className="max-w-xs text-sm text-muted-foreground">{meta.tagline}</p>
          </div>

          <motion.div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 opacity-75 blur-xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <button
              disabled={isStarting}
              onClick={handleStart}
              className={[
                "relative z-10 flex items-center gap-3 rounded-full px-8 py-4",
                "bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600",
                "text-lg font-semibold text-white shadow-2xl",
                "transform border border-white/20 backdrop-blur-sm",
                "transition-all duration-300",
                isStarting
                  ? "cursor-not-allowed opacity-75"
                  : "hover:scale-105 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-700 active:scale-95",
              ].join(" ")}
            >
              <motion.div
                animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="size-5" />
              </motion.div>
              <span>{isStarting ? "Starting…" : "Start Interview"}</span>
              <Phone className="size-5 fill-current" strokeWidth={0} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main InterviewRoom export ────────────────────────────────────────────────

interface InterviewRoomProps {
  accessToken: string;
  sessionType: string;
}

export function InterviewRoom({ accessToken, sessionType }: InterviewRoomProps) {
  const configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID;
  const messagesRef = useRef<ComponentRef<typeof Messages>>(null);
  const sessionIdRef = useRef<number | null>(null);
  const router = useRouter();

  const [sessionEnded, setSessionEnded] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const handleSessionCreated = (id: number) => {
    sessionIdRef.current = id;
  };

  const handleSessionEnd = (score: number | null) => {
    setFinalScore(score);
    setSessionEnded(true);
    sessionIdRef.current = null;
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <VoiceProvider
        onMessage={() => {
          setTimeout(() => {
            if (messagesRef.current) {
              messagesRef.current.scrollTo({
                top: messagesRef.current.scrollHeight,
                behavior: "smooth",
              });
            }
          }, 200);
        }}
        onError={(error) => {
          console.error("VoiceProvider error:", error);
          toast.error(error.message ?? "Error connecting to interview");
        }}
      >
        <EmotionCapture sessionId={sessionIdRef.current} />
        <SessionLifecycle
          sessionId={sessionIdRef.current}
          onSessionEnd={handleSessionEnd}
        />
        <Messages ref={messagesRef} />
        <Controls />
        <InterviewStartButton
          sessionType={sessionType}
          accessToken={accessToken}
          onSessionCreated={handleSessionCreated}
        />
      </VoiceProvider>

      {/* Interview complete overlay */}
      <AnimatePresence>
        {sessionEnded && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
                <Mic2 className="size-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold">Interview Complete</h2>
              {finalScore !== null && (
                <p className="text-4xl font-bold tabular-nums text-primary">
                  {finalScore}%
                </p>
              )}
              <p className="max-w-xs text-sm text-muted-foreground">
                Your session has been saved. Review your results in Interview History.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/dashboard/interviews")}
                className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                View History
              </button>
              <button
                onClick={() => router.refresh()}
                className="rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-accent"
              >
                New Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
