import { classifyArchetype } from "@/src/lib/archetype-bert";
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : null;

    if (!text) {
      return NextResponse.json(
        { error: "Missing or invalid 'text' in request body" },
        { status: 400 }
      );
    }

    const labels = Array.isArray(body?.labels)
      ? body.labels.filter((l: unknown) => typeof l === "string")
      : undefined;

    const result = await classifyArchetype(text, labels);

    if (!result) {
      return NextResponse.json(
        {
          error:
            "Archetype classification unavailable. Ensure HUGGINGFACE_API_KEY is set.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/archetype/classify]", err);
    return NextResponse.json(
      {
        error: "Classification failed",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
