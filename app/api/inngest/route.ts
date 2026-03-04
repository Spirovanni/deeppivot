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
import { broadcastAnnouncement } from "@/src/inngest/announcements";
import { gamificationStreakReset } from "@/src/inngest/gamification-streak-reset";
import { gamificationStreakExpiryNotifications } from "@/src/inngest/gamification-streak-expiry-notifications";
import { evaluateBadges } from "@/src/inngest/evaluate-badges";
import { nightlyJobMatches } from "@/src/inngest/nightly-job-matches";
import { weeklyCandidateJobMatchesDigest } from "@/src/inngest/weekly-candidate-job-matches-digest";

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
    broadcastAnnouncement,
    gamificationStreakReset,
    gamificationStreakExpiryNotifications,
    evaluateBadges,
    nightlyJobMatches,
    weeklyCandidateJobMatchesDigest,
  ],
});

