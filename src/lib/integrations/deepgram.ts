import type { IntegrationConfig } from "./types";

/**
 * Deepgram STT integration for the DeepPivot workflow engine.
 *
 * Transcribes a recording URL (e.g. from a completed Vapi call) and returns
 * the full transcript, speaker segments, and word-level timestamps.
 *
 * Requires: DEEPGRAM_API_KEY
 */
export const deepgramIntegration: IntegrationConfig = {
  provider: "deepgram",
  displayName: "Deepgram STT",
  description: "Transcribe audio recordings with speaker diarization",
  icon: "waveform",
  category: "ai",
  configFields: [
    {
      key: "audioUrl",
      label: "Audio URL",
      type: "text",
      required: true,
      placeholder: "{{vapi.recordingUrl}}",
    },
    {
      key: "model",
      label: "Model",
      type: "select",
      required: false,
      defaultValue: "nova-3",
      options: [
        { label: "Nova 3 (best accuracy)", value: "nova-3" },
        { label: "Nova 2", value: "nova-2" },
        { label: "Enhanced", value: "enhanced" },
        { label: "Base", value: "base" },
      ],
    },
    {
      key: "language",
      label: "Language",
      type: "text",
      required: false,
      defaultValue: "en-US",
      placeholder: "en-US",
    },
    {
      key: "diarize",
      label: "Speaker Diarization",
      type: "select",
      required: false,
      defaultValue: "true",
      options: [
        { label: "Enabled", value: "true" },
        { label: "Disabled", value: "false" },
      ],
    },
    {
      key: "utterances",
      label: "Split into Utterances",
      type: "select",
      required: false,
      defaultValue: "true",
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ],
    },
    {
      key: "smartFormat",
      label: "Smart Formatting",
      type: "select",
      required: false,
      defaultValue: "true",
      options: [
        { label: "Enabled", value: "true" },
        { label: "Disabled", value: "false" },
      ],
    },
  ],
};
