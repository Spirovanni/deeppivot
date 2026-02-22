import {
  startBatchEmotionAnalysis,
  analyzeRecordingUrl,
} from "@/src/lib/hume";
import type { NodeExecutionContext, NodeExecutionResult } from "@/src/lib/integrations/types";

/**
 * Execute a Hume.ai emotion analysis node within a workflow.
 *
 * Submits the recording URL to Hume's batch prosody API. By default, returns
 * the jobId immediately (non-blocking) so an Inngest worker can poll and
 * persist results. Set config.waitForCompletion = "true" for short recordings
 * where inline waiting is acceptable.
 *
 * Required config fields: recordingUrl
 * Optional config fields: prosody, language, waitForCompletion
 */
export async function executeHumeNode(
  ctx: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const { config, workflowId, userId } = ctx;

  if (!config.recordingUrl?.trim()) {
    return { success: false, error: "Missing required field: recordingUrl" };
  }

  const analysisOptions = {
    prosody: config.prosody !== "false",
    language: config.language === "true",
    face: false,
  };

  try {
    // ── Inline mode: wait for results (short recordings only) ────────────────
    if (config.waitForCompletion === "true") {
      const results = await analyzeRecordingUrl(
        config.recordingUrl.trim(),
        analysisOptions
      );

      return {
        success: true,
        data: {
          jobId: results.jobId,
          completed: true,
          snapshotCount: results.snapshots.length,
          overallDominantEmotion: results.overallDominantEmotion,
          aggregateEmotions: results.aggregateEmotions,
          userId,
          workflowId,
        },
      };
    }

    // ── Async mode: return job ID for Inngest polling (default) ──────────────
    const jobId = await startBatchEmotionAnalysis(
      [config.recordingUrl.trim()],
      analysisOptions
    );

    return {
      success: true,
      data: {
        jobId,
        completed: false,
        recordingUrl: config.recordingUrl.trim(),
        userId,
        workflowId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Hume emotion analysis failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
