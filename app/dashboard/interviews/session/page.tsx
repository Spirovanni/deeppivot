import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getEviAccessToken } from "@/src/lib/hume";
import { InterviewRoom } from "./_components/InterviewRoom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface InterviewSessionPageProps {
  searchParams: { type?: string };
}

export default async function InterviewSessionPage({
  searchParams,
}: InterviewSessionPageProps) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const sessionType = searchParams.type ?? "general";

  let accessToken: string | null = null;
  try {
    accessToken = await getEviAccessToken();
  } catch (error) {
    console.error("Failed to get Hume access token:", error);
  }

  if (!accessToken) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">
          Unable to connect to the AI interview service. Please try again.
        </p>
        <Link
          href="/dashboard/interviews"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Go back to Interviews
        </Link>
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
        <InterviewRoom accessToken={accessToken} sessionType={sessionType} />
      </div>
    </div>
  );
}
