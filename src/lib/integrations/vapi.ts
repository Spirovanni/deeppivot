import type { IntegrationConfig } from "./types";

/**
 * Vapi voice AI integration for the DeepPivot workflow engine.
 *
 * Enables triggering AI voice interview sessions from within automated
 * workflows — e.g. "send a Vapi interview call when a job application
 * reaches the Interview stage."
 *
 * Requires: VAPI_API_KEY, VAPI_INTERVIEW_ASSISTANT_ID
 */
export const vapiIntegration: IntegrationConfig = {
  provider: "vapi",
  displayName: "Vapi Voice AI",
  description: "Trigger an AI voice interview call via Vapi",
  icon: "microphone",
  category: "ai",
  configFields: [
    {
      key: "assistantId",
      label: "Assistant ID",
      type: "text",
      required: false,
      placeholder: "Leave blank to use VAPI_INTERVIEW_ASSISTANT_ID env var",
    },
    {
      key: "interviewType",
      label: "Interview Type",
      type: "select",
      required: true,
      defaultValue: "general",
      options: [
        { label: "General", value: "general" },
        { label: "Behavioral", value: "behavioral" },
        { label: "Technical", value: "technical" },
        { label: "Situational", value: "situational" },
      ],
    },
    {
      key: "candidateName",
      label: "Candidate Name",
      type: "text",
      required: false,
      placeholder: "{{user.firstName}} {{user.lastName}}",
    },
    {
      key: "maxDurationSeconds",
      label: "Max Duration (seconds)",
      type: "number",
      required: false,
      defaultValue: "1800",
      placeholder: "1800",
    },
    {
      key: "recordingEnabled",
      label: "Enable Recording",
      type: "select",
      required: false,
      defaultValue: "true",
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ],
    },
    {
      key: "phoneNumber",
      label: "Phone Number (outbound calls only)",
      type: "text",
      required: false,
      placeholder: "+14155551234 — leave blank for web calls",
    },
  ],
};
