/**
 * OpenAI Embeddings Service
 *
 * Provides semantic vector embeddings via the OpenAI Embeddings API
 * (text-embedding-3-small by default, configurable via env).
 *
 * Used for:
 *   - Semantic search across career resources and education programs
 *   - Matching job seekers to mentor profiles
 *   - Similarity scoring for career archetype classification
 *   - Retrieving relevant context for LLM prompts (RAG)
 *
 * Env vars:
 *   OPENAI_API_KEY            – Required
 *   EMBEDDING_MODEL           – Optional, defaults to "text-embedding-3-small"
 *   EMBEDDING_DIMENSIONS      – Optional, defaults to 1536 (full)
 *
 * Docs: https://platform.openai.com/docs/guides/embeddings
 */

import "server-only";
import OpenAI from "openai";

// ─── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "text-embedding-3-small";
const DEFAULT_DIMENSIONS = 1536;

function getConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY must be set for the embeddings service.");
  }
  return {
    apiKey,
    model: process.env.EMBEDDING_MODEL ?? DEFAULT_MODEL,
    dimensions:
      Number(process.env.EMBEDDING_DIMENSIONS) || DEFAULT_DIMENSIONS,
  };
}

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (_client) return _client;
  const { apiKey } = getConfig();
  _client = new OpenAI({ apiKey });
  return _client;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmbeddingVector = number[];

export interface EmbeddingResult {
  text: string;
  embedding: EmbeddingVector;
  /** Total tokens consumed by this embedding call */
  tokens: number;
}

export interface BatchEmbeddingResult {
  results: EmbeddingResult[];
  totalTokens: number;
}

export interface SemanticSearchResult<T> {
  item: T;
  score: number;
}

// ─── Core embedding functions ─────────────────────────────────────────────────

/**
 * Generate an embedding vector for a single text string.
 * Strips whitespace and newlines per OpenAI's recommendation.
 */
export async function embedText(text: string): Promise<EmbeddingResult> {
  const { model, dimensions } = getConfig();
  const client = getClient();

  const normalized = text.replace(/\n/g, " ").trim();

  const response = await client.embeddings.create({
    model,
    input: normalized,
    dimensions,
    encoding_format: "float",
  });

  return {
    text: normalized,
    embedding: response.data[0].embedding,
    tokens: response.usage.total_tokens,
  };
}

/**
 * Generate embeddings for multiple texts in a single API call.
 * OpenAI supports up to 2048 inputs per request.
 * Automatically batches if the input exceeds that limit.
 */
export async function embedBatch(
  texts: string[]
): Promise<BatchEmbeddingResult> {
  if (texts.length === 0) {
    return { results: [], totalTokens: 0 };
  }

  const { model, dimensions } = getConfig();
  const client = getClient();

  const BATCH_SIZE = 512; // conservative batch size for reliability
  const allResults: EmbeddingResult[] = [];
  let totalTokens = 0;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE).map((t) =>
      t.replace(/\n/g, " ").trim()
    );

    const response = await client.embeddings.create({
      model,
      input: batch,
      dimensions,
      encoding_format: "float",
    });

    const sorted = response.data.sort((a, b) => a.index - b.index);
    for (let j = 0; j < batch.length; j++) {
      allResults.push({
        text: batch[j],
        embedding: sorted[j].embedding,
        tokens: 0, // usage is aggregated below
      });
    }

    totalTokens += response.usage.total_tokens;
  }

  return { results: allResults, totalTokens };
}

// ─── Similarity ───────────────────────────────────────────────────────────────

/**
 * Compute cosine similarity between two embedding vectors.
 * Returns a value in [-1, 1] where 1 = identical direction.
 *
 * For normalized embeddings (as returned by OpenAI), this is equivalent
 * to a dot product.
 */
export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  if (a.length !== b.length) {
    throw new Error(
      `Vector dimension mismatch: ${a.length} vs ${b.length}`
    );
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Semantic search ──────────────────────────────────────────────────────────

/**
 * Rank a list of items by semantic similarity to a query string.
 *
 * @param query      - The search query text
 * @param items      - Array of items to rank
 * @param getText    - Function that extracts the searchable text from each item
 * @param topK       - Maximum number of results to return (default: 10)
 * @param threshold  - Minimum similarity score to include (default: 0.0)
 *
 * @example
 * const results = await semanticSearch(
 *   "machine learning engineer career path",
 *   resources,
 *   (r) => `${r.title} ${r.description}`,
 *   5,
 *   0.3
 * );
 */
export async function semanticSearch<T>(
  query: string,
  items: T[],
  getText: (item: T) => string,
  topK = 10,
  threshold = 0.0
): Promise<SemanticSearchResult<T>[]> {
  if (items.length === 0) return [];

  // Embed query + all item texts in parallel
  const itemTexts = items.map(getText);
  const [queryResult, { results: itemResults }] = await Promise.all([
    embedText(query),
    embedBatch(itemTexts),
  ]);

  const scored: SemanticSearchResult<T>[] = items.map((item, i) => ({
    item,
    score: cosineSimilarity(queryResult.embedding, itemResults[i].embedding),
  }));

  return scored
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ─── Pre-computed embedding cache helpers ────────────────────────────────────

/**
 * Serialize an embedding vector to a compact JSON string for DB storage.
 * Use with a `text` or `jsonb` column.
 */
export function serializeEmbedding(embedding: EmbeddingVector): string {
  return JSON.stringify(embedding);
}

/**
 * Deserialize an embedding vector from a DB-stored string or array.
 */
export function deserializeEmbedding(
  stored: string | number[] | null | undefined
): EmbeddingVector | null {
  if (!stored) return null;
  if (Array.isArray(stored)) return stored;
  try {
    return JSON.parse(stored) as EmbeddingVector;
  } catch {
    return null;
  }
}
