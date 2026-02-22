/**
 * Inngest API route — serves as the event handler for Inngest.
 *
 * Inngest Dev Server: npx inngest dev
 */

import { serve } from "inngest/next";
import { inngest } from "@/src/inngest/client";
import {
  processInterviewRecording,
  processInterviewTranscription,
  processInterviewEmotionalAnalysis,
  processInterviewFeedback,
  processCareerArchetyping,
} from "@/src/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processInterviewRecording,
    processInterviewTranscription,
    processInterviewEmotionalAnalysis,
    processInterviewFeedback,
    processCareerArchetyping,
  ],
});
