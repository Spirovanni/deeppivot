import { transcribeUrl, extractSpeakerSegments } from "@/src/lib/deepgram";
import type { NodeExecutionContext, NodeExecutionResult } from "@/src/lib/integrations/types";

/**
 * Execute a Deepgram STT node within a workflow.
 *
 * Accepts a recording URL (typically {{vapi.recordingUrl}} from an upstream
 * Vapi node) and returns the full transcript plus speaker-labelled segments.
 *
 * Required config fields: audioUrl
 * Optional config fields: model, language, diarize, utterances, smartFormat
 */
export async function executeDeepgramNode(
  ctx: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const { config } = ctx;

  if (!config.audioUrl?.trim()) {
    return {
      success: false,
      error: "Missing required field: audioUrl",
    };
  }

  try {
    const result = await transcribeUrl(config.audioUrl.trim(), {
      model: config.model ?? "nova-3",
      language: config.language ?? "en-US",
      diarize: config.diarize !== "false",
      utterances: config.utterances !== "false",
      smartFormat: config.smartFormat !== "false",
      paragraphs: true,
    });

    const speakerSegments = extractSpeakerSegments(result);

    return {
      success: true,
      data: {
        transcript: result.transcript,
        confidence: result.confidence,
        duration: result.duration,
        requestId: result.requestId,
        utteranceCount: result.utterances.length,
        wordCount: result.words.length,
        speakerCount: new Set(speakerSegments.map((s) => s.speaker)).size,
        speakerSegments,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Deepgram transcription failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
