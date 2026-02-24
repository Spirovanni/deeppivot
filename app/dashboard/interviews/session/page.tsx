import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ElevenLabsInterviewRoom } from "./_components/ElevenLabsInterviewRoom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface InterviewSessionPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function InterviewSessionPage({
  searchParams,
}: InterviewSessionPageProps) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { type } = await searchParams;
  const sessionType = type ?? "general";

  // Get ElevenLabs agent ID from environment
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

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
        <div className="mt-4 rounded-lg border border-border bg-card p-4 text-left text-xs text-muted-foreground">
          <p className="font-mono">
            After creating your agent, add to .env:
            <br />
            <code className="mt-2 block rounded bg-muted p-2">
              NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id
            </code>
          </p>
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
        <ElevenLabsInterviewRoom agentId={agentId} sessionType={sessionType} />
      </div>
    </div>
  );
}
