import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit } from "@/src/lib/rate-limit";
import { generateCandidateMatchExplanation } from "@/src/lib/match-explanations";

/**
 * GET /api/jobs/matches/explain?jobId=123
 * Candidate-only helper that returns a short "why you match" explanation.
 */
export async function GET(req: NextRequest) {
  const rl = await rateLimit(req, "DEFAULT");
  if (!rl.success) return rl.response;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const jobIdRaw = url.searchParams.get("jobId");
    const jobId = Number.parseInt(jobIdRaw ?? "", 10);
    if (!jobIdRaw || Number.isNaN(jobId) || jobId <= 0) {
      return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
    }

    const result = await generateCandidateMatchExplanation(userId, jobId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && /not found/i.test(error.message)) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 });
  }
}
