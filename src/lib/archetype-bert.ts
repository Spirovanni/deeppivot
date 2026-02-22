/**
 * Career archetype classification via Hugging Face Inference API.
 *
 * Uses zero-shot classification (BART/MNLI-style) to map text (e.g. interview
 * feedback) to career archetype labels. A custom fine-tuned BERT model can be
 * swapped in by changing HUGGINGFACE_ARCHETYPE_MODEL or the inference endpoint.
 */

import { ARCHETYPES } from "./archetypes";

const HF_BASE = "https://api-inference.huggingface.co/models";
const DEFAULT_MODEL = "facebook/bart-large-mnli";

export interface ArchetypeClassificationResult {
  /** Archetype ID (e.g. strategist, innovator) */
  archetypeId: string;
  /** Confidence score 0–1 */
  score: number;
  /** All label scores for transparency */
  scores: Array<{ label: string; score: number }>;
}

const ARCHETYPE_LABELS = ARCHETYPES.map((a) => a.name);

/**
 * Classify text into career archetypes using Hugging Face zero-shot classification.
 *
 * @param text - Input text (e.g. interview feedback, assessment summary)
 * @param labels - Optional custom labels; defaults to archetype names
 * @returns Top archetype and scores, or null if API unavailable
 */
export async function classifyArchetype(
  text: string,
  labels: string[] = ARCHETYPE_LABELS
): Promise<ArchetypeClassificationResult | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model =
    process.env.HUGGINGFACE_ARCHETYPE_MODEL ?? DEFAULT_MODEL;

  if (!apiKey) {
    console.warn(
      "[archetype-bert] HUGGINGFACE_API_KEY not set; skipping classification"
    );
    return null;
  }

  const url = `${HF_BASE}/${model}`;
  const body = {
    inputs: text.slice(0, 1024), // HF token limits
    parameters: {
      candidate_labels: labels,
      multi_label: false,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(
        `[archetype-bert] HF API error ${res.status}: ${errText}`
      );
      return null;
    }

    const data = (await res.json()) as
      | { sequence: string; labels: string[]; scores: number[] }
      | { error: string };

    if ("error" in data) {
      console.error(`[archetype-bert] HF error: ${data.error}`);
      return null;
    }

    const { labels: outLabels, scores } = data;
    const scoresList = outLabels.map((l, i) => ({
      label: l,
      score: scores[i] ?? 0,
    }));
    const top = scoresList[0];
    if (!top) return null;

    // Map display name back to archetype ID
    const archetype = ARCHETYPES.find(
      (a) => a.name === top.label || a.id === top.label.toLowerCase().replace(/^the\s+/i, "")
    );
    const archetypeId =
      archetype?.id ??
      top.label.toLowerCase().replace(/^the\s+/i, "").replace(/\s+/g, "-");

    return {
      archetypeId,
      score: top.score,
      scores: scoresList,
    };
  } catch (err) {
    console.error("[archetype-bert] Classification failed:", err);
    return null;
  }
}
