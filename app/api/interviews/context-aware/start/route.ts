import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/src/db";
import {
  usersTable,
  interviewSessionsTable,
  jobDescriptionsTable,
  userResumesTable,
} from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit } from "@/src/lib/rate-limit";
import {
  createConversationalAgent,
  getConversationalAISignedUrl,
} from "@/src/lib/elevenlabs";
import { buildContextAwarePrompt } from "@/src/lib/prompts/context-aware-interview";
import type { JobDescriptionExtraction } from "@/src/lib/llm/prompts/job-descriptions";

const contextAwareStartSchema = z.object({
  jobDescriptionId: z.number().int().positive(),
  resumeId: z.number().int().positive().optional(),
  sessionType: z
    .enum(["behavioral", "technical", "situational", "general"])
    .default("general"),
});

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, "INTERVIEW_START");
  if (!rl.success) return rl.response;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ id: usersTable.id, organizationId: usersTable.organizationId })
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = contextAwareStartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { jobDescriptionId, resumeId, sessionType } = parsed.data;

    // Verify job description ownership and extraction status
    const [jobDesc] = await db
      .select()
      .from(jobDescriptionsTable)
      .where(
        and(
          eq(jobDescriptionsTable.id, jobDescriptionId),
          eq(jobDescriptionsTable.userId, user.id)
        )
      )
      .limit(1);

    if (!jobDesc) {
      return NextResponse.json(
        { error: "Job description not found" },
        { status: 404 }
      );
    }

    if (jobDesc.status !== "extracted") {
      return NextResponse.json(
        {
          error: "Job description data not yet extracted",
          detail: `Current status: ${jobDesc.status}. Only job descriptions with status "extracted" can be used for context-aware interviews.`,
        },
        { status: 422 }
      );
    }

    const extractedData = jobDesc.extractedData as JobDescriptionExtraction;

    // Optionally verify resume ownership
    let resumeData: { parsedData: unknown; rawText: string | null } | null =
      null;
    if (resumeId) {
      const [resume] = await db
        .select({
          id: userResumesTable.id,
          parsedData: userResumesTable.parsedData,
          rawText: userResumesTable.rawText,
        })
        .from(userResumesTable)
        .where(
          and(
            eq(userResumesTable.id, resumeId),
            eq(userResumesTable.userId, user.id)
          )
        )
        .limit(1);

      if (!resume) {
        return NextResponse.json(
          { error: "Resume not found" },
          { status: 404 }
        );
      }

      resumeData = { parsedData: resume.parsedData, rawText: resume.rawText };
    }

    // Build the context-aware system prompt
    const { systemPrompt, firstMessage } = buildContextAwarePrompt({
      extractedData,
      resumeData,
      sessionType,
    });

    // Create a temporary ElevenLabs agent with the enriched prompt
    const agent = await createConversationalAgent({
      name: `Context Interview - ${extractedData.jobTitle ?? "Custom"} - ${Date.now()}`,
      systemPrompt,
      firstMessage,
      voiceId: process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM",
    });

    const agentId = agent.agent_id;

    // Get signed URL for WebSocket connection
    const signedUrl = await getConversationalAISignedUrl(agentId);

    // Create interview session with context FKs populated
    const [session] = await db
      .insert(interviewSessionsTable)
      .values({
        userId: user.id,
        organizationId: user.organizationId,
        sessionType,
        status: "active",
        jobDescriptionId,
        resumeId: resumeId ?? null,
      })
      .returning();

    return NextResponse.json({
      sessionId: session.id,
      agentId,
      signedUrl,
    });
  } catch (error) {
    console.error("Error starting context-aware interview:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to start context-aware interview",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
