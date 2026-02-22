import type { IntegrationConfig } from "./types";

/**
 * Hume.ai emotion inference integration for the DeepPivot workflow engine.
 *
 * Submits a recording URL to Hume's Expression Measurement batch API for
 * prosody-based emotion analysis. Returns the job ID for async polling by
 * the Inngest emotion analysis job (deeppivot-43).
 *
 * Requires: HUME_API_KEY, HUME_SECRET_KEY
 */
export const humeIntegration: IntegrationConfig = {
  provider: "hume",
  displayName: "Hume.ai Emotion Analysis",
  description: "Analyse voice emotions from a recording URL using Hume prosody model",
  icon: "brain",
  category: "ai",
  configFields: [
    {
      key: "recordingUrl",
      label: "Recording URL",
      type: "text",
      required: true,
      placeholder: "{{vapi.recordingUrl}}",
    },
    {
      key: "prosody",
      label: "Voice (Prosody) Model",
      type: "select",
      required: false,
      defaultValue: "true",
      options: [
        { label: "Enabled", value: "true" },
        { label: "Disabled", value: "false" },
      ],
    },
    {
      key: "language",
      label: "Language (Text) Model",
      type: "select",
      required: false,
      defaultValue: "false",
      options: [
        { label: "Disabled", value: "false" },
        { label: "Enabled", value: "true" },
      ],
    },
    {
      key: "waitForCompletion",
      label: "Wait for Job Completion",
      type: "select",
      required: false,
      defaultValue: "false",
      options: [
        { label: "No — return job ID only (recommended)", value: "false" },
        { label: "Yes — wait and return results inline", value: "true" },
      ],
    },
  ],
};
