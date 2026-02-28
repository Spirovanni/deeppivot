import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ElevenLabsInterviewRoom } from "./_components/ElevenLabsInterviewRoom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/src/db";
import {
  usersTable,
  interviewSessionsTable,
  jobDescriptionsTable,
  userResumesTable,
} from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { createConversationalAgent } from "@/src/lib/elevenlabs";
import { buildContextAwarePrompt } from "@/src/lib/prompts/context-aware-interview";
import type { JobDescriptionExtraction } from "@/src/lib/llm/prompts/job-descriptions";

interface InterviewSessionPageProps {
  searchParams: Promise<{ type?: string; targetJobId?: string; resumeId?: string }>;
}

export default async function InterviewSessionPage({
  searchParams,
}: InterviewSessionPageProps) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [dbUser] = await db
    .select({ id: usersTable.id, organizationId: usersTable.organizationId })
    .from(usersTable)
    .where(eq(usersTable.clerkId, user.id))
    .limit(1);

  if (!dbUser) redirect("/sign-in");

  const { type, targetJobId, resumeId } = await searchParams;
  const sessionType = type ?? "general";

  let agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  let preCreatedSessionId: number | undefined = undefined;
  let parsedJobDescription: JobDescriptionExtraction | undefined = undefined;

  // Context-Aware Initialization
  if (targetJobId && targetJobId !== "none") {
    // 1. Fetch Job Description
    const [jobDesc] = await db
      .select()
      .from(jobDescriptionsTable)
      .where(
        and(
          eq(jobDescriptionsTable.id, parseInt(targetJobId, 10)),
          eq(jobDescriptionsTable.userId, dbUser.id)
        )
      )
      .limit(1);

    if (jobDesc && jobDesc.status === "extracted") {
      parsedJobDescription = jobDesc.extractedData as JobDescriptionExtraction;

      // 2. Add Resume Context (optional)
      let resumeData: { parsedData: unknown; rawText: string | null } | null = null;
      if (resumeId && resumeId !== "none") {
        const [resume] = await db
          .select({
            id: userResumesTable.id,
            parsedData: userResumesTable.parsedData,
            rawText: userResumesTable.rawText,
          })
          .from(userResumesTable)
          .where(
            and(
              eq(userResumesTable.id, parseInt(resumeId, 10)),
              eq(userResumesTable.userId, dbUser.id)
            )
          )
          .limit(1);

        if (resume) {
          resumeData = { parsedData: resume.parsedData, rawText: resume.rawText };
        }
      }

      // 3. Build context-aware prompt
      const { systemPrompt, firstMessage } = buildContextAwarePrompt({
        extractedData: parsedJobDescription,
        resumeData,
        sessionType,
      });

      // 4. Create ephemeral agent
      const agent = await createConversationalAgent({
        name: `Context Interview - ${parsedJobDescription.jobTitle ?? "Custom"} - ${Date.now()}`,
        systemPrompt,
        firstMessage,
        voiceId: process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM",
      });

      agentId = agent.agent_id;

      // 5. Create DB session
      const [session] = await db
        .insert(interviewSessionsTable)
        .values({
          userId: dbUser.id,
          organizationId: dbUser.organizationId,
          sessionType,
          status: "active",
          jobDescriptionId: jobDesc.id,
          resumeId: resumeId && resumeId !== "none" ? parseInt(resumeId, 10) : null,
        })
        .returning();

      preCreatedSessionId = session.id;
    }
  }

  if (!agentId || agentId === "your-agent-id-here") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-amber-500/10">
          <span className="text-3xl">🔧</span>
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-semibold">Agent Setup Required</h2>
          <p className="text-sm text-muted-foreground">
            To use the AI Interview Coach, you need to create an ElevenLabs agent and add its ID to your environment variables.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <a
            href="https://elevenlabs.io/app/conversational-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create Agent on ElevenLabs →
          </a>
          <Link
            href="/dashboard/interviews"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            ← Back to Interviews
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col md:h-screen">
      {/* Back navigation */}
      <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
        <Link
          href="/dashboard/interviews"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Interviews
        </Link>
      </div>

      {/* Live interview room fills the rest */}
      <div className="relative min-h-0 flex-1">
        <ElevenLabsInterviewRoom
          agentId={agentId}
          sessionType={sessionType}
          preCreatedSessionId={preCreatedSessionId}
          jobDescription={parsedJobDescription}
        />
      </div>
    </div>
  );
}
