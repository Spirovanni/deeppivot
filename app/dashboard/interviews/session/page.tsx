import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ElevenLabsInterviewRoom } from "./_components/ElevenLabsInterviewRoom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/src/db";
import {
  usersTable,
  jobDescriptionsTable,
} from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import type { JobDescriptionExtraction } from "@/src/lib/llm/prompts/job-descriptions";

interface InterviewSessionPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InterviewSessionPage(props: InterviewSessionPageProps) {
  const searchParams = await props.searchParams;

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [dbUser] = await db
    .select({ id: usersTable.id, organizationId: usersTable.organizationId })
    .from(usersTable)
    .where(eq(usersTable.clerkId, user.id))
    .limit(1);

  if (!dbUser) redirect("/sign-in");

  const type = searchParams.type as string | undefined;
  const jobDescriptionId = searchParams.jobDescriptionId as string | undefined;
  const signedUrl = searchParams.signedUrl as string | undefined;
  const agentId = searchParams.agentId as string | undefined;
  const sessionId = searchParams.sessionId as string | undefined;

  const sessionType = type ?? "general";

  let finalAgentId = agentId || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  let parsedJobDescription: JobDescriptionExtraction | undefined = undefined;

  // If a jobDescriptionId is passed (e.g. from the InterviewSettingsModal), fetch it for the UI panel
  if (jobDescriptionId) {
    const [jobDesc] = await db
      .select()
      .from(jobDescriptionsTable)
      .where(
        and(
          eq(jobDescriptionsTable.id, parseInt(jobDescriptionId, 10)),
          eq(jobDescriptionsTable.userId, dbUser.id)
        )
      )
      .limit(1);

    if (jobDesc && jobDesc.status === "extracted" && jobDesc.extractedData) {
      parsedJobDescription = jobDesc.extractedData as JobDescriptionExtraction;
    }
  }

  if (!finalAgentId || finalAgentId === "your-agent-id-here") {
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
          agentId={finalAgentId}
          sessionType={sessionType}
          preCreatedSessionId={sessionId ? parseInt(sessionId, 10) : undefined}
          preSignedUrl={signedUrl}
          jobDescription={parsedJobDescription}
        />
      </div>
    </div>
  );
}
