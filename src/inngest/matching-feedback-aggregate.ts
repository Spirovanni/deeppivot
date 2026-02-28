/**
 * Inngest cron: Aggregate matching feedback to improve weights
 *
 * Runs daily. Reads matching_feedback (hired/rejected outcomes), computes
 * signal correlations, and updates matching_weights for the matching algorithm.
 */

import { inngest } from "@/src/inngest/client";
import { aggregateMatchingFeedback } from "@/src/lib/matching-feedback";

export const matchingFeedbackAggregate = inngest.createFunction(
  {
    id: "matching-feedback-aggregate",
    name: "Aggregate Matching Feedback & Update Weights",
    retries: 1,
  },
  { cron: "0 4 * * *" }, // 4 AM UTC daily
  async ({ step }) => {
    const result = await step.run("aggregate-feedback", async () => {
      return aggregateMatchingFeedback();
    });
    return { updated: result.updated, summary: result.summary };
  }
);
