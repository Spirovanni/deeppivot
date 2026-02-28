import { serve } from "inngest/next";
import { inngest } from "@/src/inngest/client";
import {
  processInterviewRecording,
  processInterviewTranscription,
  processInterviewEmotionalAnalysis,
  processInterviewFeedback,
  processCareerArchetyping,
} from "@/src/inngest/functions";
import { salesforceDailySync } from "@/src/inngest/salesforce-sync";
import { sendWelcomeEmail } from "@/src/inngest/functions/send-welcome-email";
import { matchingFeedbackAggregate } from "@/src/inngest/matching-feedback-aggregate";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processInterviewRecording,
    processInterviewTranscription,
    processInterviewEmotionalAnalysis,
    processInterviewFeedback,
    processCareerArchetyping,
    salesforceDailySync,
    sendWelcomeEmail,
    matchingFeedbackAggregate,
  ],
});

