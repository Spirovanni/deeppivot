"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic, MicOff, Phone, Sparkles, Users, Code2, Lightbulb, Mic2 } from "lucide-react";
import {
  startInterviewSession,
  endInterviewSession,
} from "@/src/lib/actions/interview-sessions";
import { toast } from "@/src/lib/toast";

/**
 * Aligned with your ElevenLabs agent settings:
 * - ASR: user_input_audio_format pcm_16000 (we send PCM 16kHz)
 * - Turn: mode "turn", turn_timeout 7s, speculative_turn true (Sarah may respond after ~7s silence)
 * - Conversation: max_duration_seconds 600 (10 min)
 * - Client events: we handle audio_event, agent_response_event, user_transcription_event
 * - end_call tool: we handle server-initiated end and close session cleanly
 */
const AGENT_TURN_TIMEOUT_SEC = 7;
const AGENT_MAX_DURATION_SEC = 600;

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
  const [isMounted, setIsMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isClipping, setIsClipping] = useState(false);
  const [audioChunksSent, setAudioChunksSent] = useState(0);
  const [isBluetoothMic, setIsBluetoothMic] = useState(false);
  const [micInfo, setMicInfo] = useState<string>("");
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  const sessionIdRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const nextPlayTimeRef = useRef(0);
  const agentSampleRateRef = useRef(44100);
  const audioLevelDecayRef = useRef<NodeJS.Timeout | null>(null);
  const isAgentSpeakingRef = useRef(false);
  const router = useRouter();
  const meta = SESSION_TYPE_META[sessionType] ?? SESSION_TYPE_META.general;
  const Icon = meta.icon;

  // Prevent hydration errors by only rendering on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleStart = useCallback(async () => {
    if (isStarting || isConnected) return;
    setIsStarting(true);

    try {
      // Request microphone permission with echo cancellation and noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        }
      });
      streamRef.current = stream;
      console.log('🎤 Microphone acquired with echo cancellation enabled');

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

      // Validate signed URL
      if (!signedUrl || typeof signedUrl !== 'string') {
        throw new Error("Invalid signed URL received from server");
      }

      if (!signedUrl.startsWith('wss://') && !signedUrl.startsWith('ws://')) {
        throw new Error("Invalid WebSocket URL format");
      }

      console.log('🔗 Connecting to WebSocket...');
      console.log('🔗 URL protocol:', signedUrl.substring(0, 6));

      // Initialize WebSocket connection
      const websocket = new WebSocket(signedUrl);
      wsRef.current = websocket;

      // Set connection timeout (30 seconds)
      const connectionTimeout = setTimeout(() => {
        if (websocket.readyState !== WebSocket.OPEN) {
          console.error('⏱️ WebSocket connection timeout');
          websocket.close();
          setIsStarting(false);
          toast.error("Connection timeout. Please check your internet connection and try again.");
        }
      }, 30000);

      websocket.onopen = async () => {
        clearTimeout(connectionTimeout);
        console.log("✅ Connected to ElevenLabs WebSocket");
        setIsConnected(true);
        setIsStarting(false);
        nextPlayTimeRef.current = 0;

        // ElevenLabs keep-alive: send user_activity periodically to prevent server timeout and reset turn timer
        const userActivityInterval = setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ type: "user_activity" }));
          }
        }, 12000);
        websocket.addEventListener("close", () => clearInterval(userActivityInterval));

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

        const tracks = stream.getTracks();
        console.log("🎤 Microphone stream tracks:", tracks.map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState,
          label: t.label,
          settings: t.getSettings()
        })));

        // Log the actual constraints being used
        tracks.forEach(track => {
          const settings = track.getSettings();
          console.log('🎙️ Track settings:', {
            echoCancellation: settings.echoCancellation,
            noiseSuppression: settings.noiseSuppression,
            autoGainControl: settings.autoGainControl,
            sampleRate: settings.sampleRate
          });

          // Detect Bluetooth microphones
          const label = track.label.toLowerCase();
          const isBluetooth = label.includes('airpods') ||
                             label.includes('bluetooth') ||
                             label.includes('wireless');
          setIsBluetoothMic(isBluetooth);
          setMicInfo(track.label);

          if (isBluetooth) {
            console.warn('⚠️ BLUETOOTH MICROPHONE DETECTED:', track.label);
            console.warn('⚠️ Bluetooth mics often have poor quality in bidirectional mode (mic + speakers)');
            console.warn('⚠️ This can cause Voice Activity Detection to fail even with good amplitude');
            console.warn('⚠️ SOLUTION: Use wired headphones or MacBook built-in microphone');
          }

          // Log sample rate mismatch warnings
          if (settings.sampleRate && settings.sampleRate !== 16000) {
            console.log(`ℹ️ Microphone sample rate: ${settings.sampleRate}Hz (will be resampled to 16000Hz)`);
          }
        });

        // Check if any tracks are muted or disabled
        const mutedTracks = tracks.filter(t => t.muted);
        const disabledTracks = tracks.filter(t => !t.enabled);

        if (mutedTracks.length > 0) {
          console.warn("⚠️ Some audio tracks are muted:", mutedTracks.map(t => t.label));
          toast.error("Your microphone appears to be muted at the system level. Please check your OS audio settings.");
        }

        if (disabledTracks.length > 0) {
          console.warn("⚠️ Some audio tracks are disabled:", disabledTracks.map(t => t.label));
        }

        const source = audioContext.createMediaStreamSource(stream);

        // No software gain - rely on browser's autoGainControl and system mic volume
        console.log(`🎙️ Using raw microphone input (no software gain boost)`);

        const inputSampleRate = audioContext.sampleRate;
        const targetSampleRate = 16000;
        const needsResample = inputSampleRate !== targetSampleRate;

        console.log(`🎤 Audio setup: input ${inputSampleRate}Hz -> target ${targetSampleRate}Hz, resample: ${needsResample}`);

        let chunkCount = 0;
        let lastAudioLevel = 0;
        let clippingCount = 0;

        // Buffer audio to send in optimal chunks (100ms recommended by ElevenLabs as of Feb 2026)
        // At 16kHz, we want to send 1600 samples (0.1 seconds / 100ms) per chunk
        const SAMPLES_PER_SEND = 1600; // 0.1 seconds (100ms) at 16kHz
        let audioBuffer: number[] = [];

        // Soft gain so quiet mics still pass VAD and the agent hears you (avoids "TOO LOW" and no next question)
        const USER_AUDIO_GAIN = 2.0;

        const sendAudioChunk = (floatData: Float32Array) => {
          if (websocket.readyState !== WebSocket.OPEN) {
            return;
          }

          // CRITICAL: Don't send audio while Sarah is speaking to prevent echo/feedback
          if (isAgentSpeakingRef.current) {
            // Clear the buffer to prevent buildup while agent speaks
            if (audioBuffer.length > 0) {
              console.log(`🔇 Skipping audio capture while Sarah speaks (cleared ${audioBuffer.length} samples)`);
            }
            audioBuffer = [];
            return;
          }

          // Calculate audio level for UI feedback
          const maxAmplitude = Math.max(...Array.from(floatData).map(Math.abs));

          // Detect clipping (when audio hits maximum amplitude)
          const isCurrentlyClipping = maxAmplitude >= 0.95;
          if (isCurrentlyClipping) {
            clippingCount++;
          }

          // Apply smoothing: rise fast, decay slowly
          // Scale by 3x for visualization (0.1-0.3 raw becomes 30%-90% visual)
          const scaledLevel = Math.min(maxAmplitude * 3, 1);
          const smoothedLevel = scaledLevel > lastAudioLevel
            ? scaledLevel  // Rise immediately
            : lastAudioLevel * 0.95 + scaledLevel * 0.05;  // Decay slowly

          lastAudioLevel = smoothedLevel;
          setAudioLevel(smoothedLevel);

          // Resample audio if needed
          let data = floatData;
          if (needsResample && inputSampleRate > targetSampleRate) {
            data = resample(floatData, inputSampleRate, targetSampleRate);
          }

          // Apply soft gain so quiet speech is above VAD threshold (ElevenLabs can then ask the next question)
          const gained = new Float32Array(data.length);
          for (let i = 0; i < data.length; i++) {
            gained[i] = Math.max(-1, Math.min(1, data[i] * USER_AUDIO_GAIN));
          }
          data = gained;

          // Add to buffer (ElevenLabs recommends 100ms chunks as of Feb 2026)
          audioBuffer.push(...Array.from(data));

          // Only send when we have enough samples (100ms at 16kHz = 1600 samples)
          if (audioBuffer.length < SAMPLES_PER_SEND) {
            return;
          }

          // Take SAMPLES_PER_SEND from buffer and convert to Float32Array
          const bufferedData = new Float32Array(audioBuffer.splice(0, SAMPLES_PER_SEND));

          // Log occasionally for debugging
          chunkCount++;
          if (chunkCount % 10 === 0) { // Changed from 50 to 10 since we're sending fewer chunks now
            const clippingPercent = (clippingCount / 10) * 100;
            console.log(`🎤 Audio level: ${maxAmplitude.toFixed(4)} (smoothed: ${smoothedLevel.toFixed(2)}) ${maxAmplitude < 0.01 ? '⚠️ TOO LOW' : maxAmplitude >= 0.95 ? '⚠️ CLIPPING' : '✓'}`);
            console.log(`📊 Chunks sent: ${chunkCount} | Input: ${inputSampleRate}Hz | Output: ${targetSampleRate}Hz | Buffered PCM size: ${bufferedData.length} samples (${(bufferedData.length / targetSampleRate).toFixed(2)}s)`);
            if (clippingPercent > 20) {
              console.warn(`⚠️ Audio clipping detected in ${clippingPercent.toFixed(0)}% of chunks - reduce mic volume!`);
              setIsClipping(true);
            } else {
              setIsClipping(false);
            }
            clippingCount = 0;
          }

          const pcmData = new Int16Array(bufferedData.length);
          for (let i = 0; i < bufferedData.length; i++) {
            const s = Math.max(-1, Math.min(1, bufferedData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          const base64 = btoa(
            String.fromCharCode(...new Uint8Array(pcmData.buffer))
          );

          // Log detailed audio data every 20 chunks for VAD debugging
          if (chunkCount % 20 === 0) {
            const pcmMin = Math.min(...Array.from(pcmData));
            const pcmMax = Math.max(...Array.from(pcmData));
            const pcmAvg = Array.from(pcmData).reduce((a, b) => a + Math.abs(b), 0) / pcmData.length;
            console.log(`🔊 PCM stats: min=${pcmMin}, max=${pcmMax}, avg=${pcmAvg.toFixed(0)}, samples=${pcmData.length}, base64size=${base64.length}`);
            console.log(`🔊 Sample values (first 10):`, Array.from(pcmData.slice(0, 10)));
            console.log(`🔊 Chunk duration: ${(pcmData.length / targetSampleRate).toFixed(2)}s (target: 0.10s / 100ms for optimal VAD)`);
          }

          // ElevenLabs ConvAI expects { type: "user_audio_chunk", audio: <base64> }
          const message = {
            type: "user_audio_chunk",
            audio: base64,
          };

          websocket.send(JSON.stringify(message));

          // Track how many chunks we've sent
          setAudioChunksSent(prev => prev + 1);
        };

        // Abort if context was closed (e.g. by cleanup or handleEnd) before we finished
        if ((audioContext.state as string) === "closed") {
          return;
        }

        // Prefer AudioWorklet; fall back to ScriptProcessorNode if worklet fails
        try {
          const workletUrl = new URL(
            "/pcm-capture-processor.js",
            window.location.origin
          ).href;
          await audioContext.audioWorklet.addModule(workletUrl);
          if (audioContext.state === "closed") return;
          const workletNode = new AudioWorkletNode(
            audioContext,
            "pcm-capture-processor",
            { numberOfInputs: 1, numberOfOutputs: 1 }
          );
          console.log("✅ AudioWorklet ready");
          workletNode.port.onmessage = (e: MessageEvent<{ audio: Float32Array }>) => {
            sendAudioChunk(e.data.audio);
          };
          source.connect(workletNode);
          // DON'T connect to destination - this prevents mic feedback/echo
          // workletNode.connect(audioContext.destination);
        } catch (workletErr) {
          if ((audioContext.state as string) === "closed") return;
          console.warn("AudioWorklet unavailable, using ScriptProcessor fallback");
          const processor = audioContext.createScriptProcessor(2048, 1, 1);
          processor.onaudioprocess = (e) => {
            sendAudioChunk(e.inputBuffer.getChannelData(0));
          };
          source.connect(processor);
          // DON'T connect to destination - this prevents mic feedback/echo
          // processor.connect(audioContext.destination);
        }

        toast.success("Interview started! Sarah is ready to talk.");
      };

      websocket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);

          // Log ALL message types for debugging (except audio and ping to reduce noise)
          const messageType = message.type ||
                             (message.ping_event ? 'ping_event' : null) ||
                             (message.audio_event ? 'audio_event' : null) ||
                             (message.user_transcription_event ? 'user_transcription_event' : null) ||
                             (message.agent_response_event ? 'agent_response_event' : null) ||
                             (message.conversation_initiation_metadata_event ? 'conversation_initiation_metadata_event' : null) ||
                             'unknown';

          // Respond to server ping immediately so the connection stays open (required by ElevenLabs)
          const isPing = message.type === "ping" || message.ping_event != null;
          if (isPing) {
            const pongPayload: Record<string, unknown> = { type: "pong" };
            if (message.ping_event?.event_id != null) {
              pongPayload.event_id = message.ping_event.event_id;
            }
            websocket.send(JSON.stringify(pongPayload));
            return;
          }

          if (messageType !== 'ping_event' && messageType !== 'audio_event') {
            console.log(`📩 ElevenLabs message type: ${messageType}`, message);
          }

          // Parse sample rate from conversation_initiation_metadata (e.g. pcm_44100 -> 44100)
          const meta = message.conversation_initiation_metadata_event;
          if (meta) {
            console.log(`🔧 FULL AGENT CONFIGURATION:`, JSON.stringify(meta, null, 2));

            if (meta.agent_output_audio_format) {
              const m = meta.agent_output_audio_format.match(/pcm_(\d+)/);
              if (m) agentSampleRateRef.current = parseInt(m[1], 10);
              console.log(`🔊 Agent audio format: ${meta.agent_output_audio_format}, sample rate: ${agentSampleRateRef.current}Hz`);
            }

            // Check if transcription is enabled
            if (meta.conversation_config_override) {
              console.log(`⚙️ Conversation config override:`, meta.conversation_config_override);
            }
          }

          // Handle agent audio: ElevenLabs sends { type: "audio", audio_event: { audio_base_64: "..." } }
          const audioBase64 =
            message.audio_event?.audio_base_64 ?? message.audio?.chunk;
          if (audioBase64) {
            setIsAgentSpeaking(true);
            isAgentSpeakingRef.current = true;
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

              const sampleRate = agentSampleRateRef.current;
              let playbackCtx = playbackContextRef.current;
              if (!playbackCtx || (playbackCtx.state as string) === "closed") {
                playbackCtx = new AudioContext({ sampleRate });
                playbackContextRef.current = playbackCtx;
                if (playbackCtx.state === "suspended") {
                  await playbackCtx.resume();
                }
              }
              if ((playbackCtx.state as string) === "closed") return;

              const audioBuffer = playbackCtx.createBuffer(
                1,
                float32Data.length,
                sampleRate
              );
              audioBuffer.getChannelData(0).set(float32Data);

              // Schedule sequentially so chunks play in order (prevents fast/overlapping playback)
              const now = playbackCtx.currentTime;
              const startTime = Math.max(now, nextPlayTimeRef.current);
              nextPlayTimeRef.current = startTime + audioBuffer.duration;

              const bufferSource = playbackCtx.createBufferSource();
              bufferSource.buffer = audioBuffer;
              bufferSource.connect(playbackCtx.destination);
              bufferSource.onended = () => {
                setIsAgentSpeaking(false);
                isAgentSpeakingRef.current = false;
                console.log('🔇 Agent finished speaking - resuming user audio capture');
              };
              bufferSource.start(startTime);
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

          // Handle user transcript from user_transcription_event (live transcript from agent ASR)
          const userText = message.user_transcription_event?.user_transcript;
          if (userText && typeof userText === "string") {
            console.log(`✅ USER TRANSCRIPT RECEIVED: "${userText}"`);
            setMessages((prev) => [...prev, { role: "user", text: userText }]);
          }

          // Handle agent ending the call (end_call tool or conversation_ended)
          const toolName =
            message.tool_use?.name ??
            message.tool_call?.name ??
            message.function_call?.name;
          if (toolName === "end_call") {
            console.log("📞 Agent ended the call (end_call tool)");
            handleEnd();
            return;
          }
          if (message.conversation_ended_event || message.type === "conversation_ended") {
            console.log("📞 Conversation ended by server");
            handleEnd();
            return;
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };

      websocket.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error("❌ WebSocket error:", error);
        console.error("WebSocket ready state:", websocket.readyState);
        console.error("WebSocket URL (redacted):", websocket.url.substring(0, 50) + '...');

        // Clean up state on error
        setIsConnected(false);
        setIsStarting(false);

        toast.error("Failed to connect to interview service. Please try again.");
      };

      websocket.onclose = (ev: CloseEvent) => {
        clearTimeout(connectionTimeout);
        console.log("🔌 WebSocket closed", {
          code: ev.code,
          reason: ev.reason,
          clean: ev.wasClean
        });

        // Provide user-friendly close reasons
        if (!ev.wasClean) {
          let reason = "Connection lost unexpectedly";

          // Common close codes
          switch (ev.code) {
            case 1000:
              reason = "Interview ended normally";
              break;
            case 1001:
              reason = "Server endpoint unavailable";
              break;
            case 1006:
              reason = "Connection closed abnormally. Please check your internet connection.";
              break;
            case 1008:
              reason = "Connection rejected by server";
              break;
            case 1011:
              reason = "Server encountered an error";
              break;
            case 1012:
              reason = "Service restarting";
              break;
            case 1013:
              reason = "Service temporarily overloaded";
              break;
            case 1014:
              reason = "Invalid authentication";
              break;
            default:
              if (ev.reason) {
                reason = ev.reason;
              }
          }

          if (ev.code !== 1000) {
            console.warn("WebSocket closed unexpectedly:", reason);
            toast.error(reason);
          }
        }

        wsRef.current = null;
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

    // Close WebSocket (use ref to avoid stale closure)
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    wsRef.current = null;
    setIsConnected(false);

    // Close audio context (check state to avoid "Cannot close a closed AudioContext")
    const ctx = audioContextRef.current;
    if (ctx && (ctx.state as string) !== "closed") {
      await ctx.close();
    }
    audioContextRef.current = null;
    const playbackCtx = playbackContextRef.current;
    if (playbackCtx && (playbackCtx.state as string) !== "closed") {
      await playbackCtx.close();
    }
    playbackContextRef.current = null;

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
  }, []);

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
      // Cleanup only on actual unmount to avoid closing mid-setup
      const socket = wsRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) socket.close();
      wsRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      const ctx = audioContextRef.current;
      if (ctx && (ctx.state as string) !== "closed") {
        ctx.close();
      }
      audioContextRef.current = null;
      const playbackCtx = playbackContextRef.current;
      if (playbackCtx && (playbackCtx.state as string) !== "closed") {
        playbackCtx.close();
      }
      playbackContextRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run only on unmount
  }, []);

  // Prevent hydration errors
  if (!isMounted) {
    return null;
  }

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
          <div className="flex items-center gap-3">
            {isConnected && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <div className="size-2 animate-pulse rounded-full bg-green-600" />
                Live
              </div>
            )}
            {isAgentSpeaking && (
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <div className="size-2 animate-pulse rounded-full bg-blue-600" />
                Sarah is speaking...
              </div>
            )}
          </div>
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
          <div className="flex w-full max-w-2xl flex-col gap-6 overflow-y-auto max-h-full pb-8">
            {/* Transcript */}
            <div className="flex-1 space-y-4 rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <h4 className="font-semibold">Interview with Sarah</h4>
                  <p className="text-xs text-muted-foreground">
                    She&apos;ll ask about your target role, then ~5–7 questions with follow‑ups, give quick feedback after each answer, and end with a summary of your performance.
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {isAgentSpeaking
                    ? "Sarah's turn"
                    : audioLevel > 0.15
                      ? "Listening…"
                      : messages.length > 0
                        ? "Your turn — speak when ready"
                        : null}
                </span>
              </div>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-semibold">👋 Sarah is ready for your interview.</p>
                    <p className="mt-1">
                      Start by telling her what role you&apos;re preparing for. She&apos;ll then ask ~5–7 realistic questions (with follow‑ups), give brief feedback on each answer, and finish with key takeaways. As you speak, your words will appear here; after about {AGENT_TURN_TIMEOUT_SEC} seconds of silence, she may jump in with her next question. Sessions can run up to {AGENT_MAX_DURATION_SEC / 60} minutes.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-3 text-sm ${
                        msg.role === "user"
                          ? "bg-blue-50 border-l-4 border-blue-500 text-blue-900"
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

            {/* Bluetooth Warning */}
            {isBluetoothMic && (
              <div className="w-full rounded-lg border-2 border-red-500 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-900">⚠️ BLUETOOTH MICROPHONE DETECTED</p>
                <p className="mt-1 text-xs text-red-800">
                  <strong>Device:</strong> {micInfo}
                </p>
                <p className="mt-2 text-xs text-red-800">
                  <strong>Problem:</strong> Bluetooth microphones use heavy compression when both mic and speakers are active,
                  causing audio artifacts that prevent voice detection even with good amplitude levels.
                </p>
                <p className="mt-2 text-xs font-semibold text-red-900">
                  ✓ SOLUTION: Switch to MacBook built-in microphone or wired headphones!
                </p>
                <p className="mt-1 text-xs text-red-800">
                  Mac: System Settings → Sound → Input → Select "MacBook Pro Microphone"
                </p>
              </div>
            )}

            {/* Audio Level Indicator */}
            <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-semibold">Microphone Check</span>
                {isClipping ? (
                  <span className="text-xs text-red-600 font-semibold">⚠️ Clipping!</span>
                ) : audioLevel > 0.3 ? (
                  <span className="text-xs text-green-600 font-semibold">✓ Good Level</span>
                ) : audioLevel > 0.15 ? (
                  <span className="text-xs text-yellow-600 font-semibold">⚠️ Low</span>
                ) : (
                  <span className="text-xs text-red-600 font-semibold">⚠️ Too Low</span>
                )}
              </div>
              <div className="flex w-full items-center gap-2">
                <span className="text-xs text-muted-foreground">Level:</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted border border-border">
                  <div
                    className={`h-full transition-all duration-100 ${
                      isClipping ? 'bg-red-600' :
                      audioLevel > 0.3 ? 'bg-green-500' :
                      audioLevel > 0.15 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{(audioLevel * 100).toFixed(0)}%</span>
              </div>
              {audioLevel < 0.15 && !isClipping && (
                <div className="w-full rounded bg-yellow-50 p-2 text-xs text-yellow-800">
                  <p className="font-semibold">⚠️ Your microphone is too quiet!</p>
                  <p className="mt-1">Please fix the following:</p>
                  <ul className="mt-1 ml-4 list-disc space-y-0.5">
                    <li><strong>Use headphones or earbuds</strong> to prevent echo</li>
                    <li>Mac: System Settings → Sound → Input → Increase input volume slider</li>
                    <li>Make sure the correct microphone is selected</li>
                    <li>Speak normally and watch the level bar reach 30-60% (green)</li>
                  </ul>
                </div>
              )}
              {isClipping && (
                <div className="w-full rounded bg-red-50 p-2 text-xs text-red-800">
                  <p className="font-semibold">⚠️ Audio distortion detected!</p>
                  <p className="mt-1">Your microphone input is too loud, causing distortion. ElevenLabs cannot transcribe distorted audio.</p>
                  <p className="mt-1"><strong>Fix:</strong> Mac: System Settings → Sound → Input → Reduce input volume slider to 30-50%</p>
                </div>
              )}
              {!isClipping && audioLevel >= 0.3 && messages.length === 0 && (
                <div className="w-full rounded bg-green-50 dark:bg-green-950/30 p-2 text-xs text-green-800 dark:text-green-200">
                  <p className="font-semibold">✓ Mic level good.</p>
                  <p className="mt-1">Your live transcript will appear above. Sarah may respond after ~{AGENT_TURN_TIMEOUT_SEC}s of silence (turn-based).</p>
                </div>
              )}
              <div className="w-full flex justify-between items-center pt-1 border-t border-border">
                <span className="text-xs text-muted-foreground">Audio chunks sent:</span>
                <span className="text-xs font-mono text-muted-foreground">{audioChunksSent}</span>
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
