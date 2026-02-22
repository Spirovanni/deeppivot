import { startInterviewCall, createPhoneCall } from "@/src/lib/vapi";
import type { NodeExecutionContext, NodeExecutionResult } from "@/src/lib/integrations/types";

/**
 * Execute a Vapi voice AI node within a workflow.
 *
 * Supports two modes:
 *  - Web call (default): creates a browser-joinable session and returns the URL
 *  - Phone call: if `config.phoneNumber` is supplied, dials out to that number
 *
 * Required config fields: interviewType
 * Optional config fields: assistantId, candidateName, maxDurationSeconds,
 *                         recordingEnabled, phoneNumber
 */
export async function executeVapiNode(
  ctx: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const { config, userId } = ctx;

  const interviewType = (config.interviewType ?? "general") as
    | "behavioral"
    | "technical"
    | "situational"
    | "general";

  const maxDurationSeconds = config.maxDurationSeconds
    ? parseInt(config.maxDurationSeconds, 10)
    : 1800;

  try {
    // ── Phone call mode ───────────────────────────────────────────────────────
    if (config.phoneNumber?.trim()) {
      const call = await createPhoneCall({
        assistantId:
          config.assistantId?.trim() ||
          (process.env.VAPI_INTERVIEW_ASSISTANT_ID ?? ""),
        customer: {
          number: config.phoneNumber.trim(),
          name: config.candidateName?.trim() || undefined,
        },
        assistantOverrides: {
          maxDurationSeconds,
          recordingEnabled: config.recordingEnabled !== "false",
          metadata: {
            interviewType,
            userId: String(userId),
            workflowId: ctx.workflowId,
          },
        },
        metadata: {
          source: "deeppivot",
          userId: String(userId),
          workflowId: ctx.workflowId,
        },
      });

      return {
        success: true,
        data: {
          callId: call.id,
          callType: "phone",
          status: call.status,
          interviewType,
        },
      };
    }

    // ── Web call mode (default) ───────────────────────────────────────────────
    const call = await startInterviewCall({
      assistantId: config.assistantId?.trim() || undefined,
      interviewType,
      candidateName: config.candidateName?.trim() || undefined,
      maxDurationSeconds,
    });

    return {
      success: true,
      data: {
        callId: call.id,
        callType: "web",
        status: call.status,
        webCallUrl: (call as { webCallUrl?: string }).webCallUrl,
        interviewType,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Vapi call failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
