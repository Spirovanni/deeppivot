import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import {
  coverLettersTable,
  jobDescriptionsTable,
  usersTable,
} from "@/src/db/schema";
import { eq, desc, and, like } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Optional jobId param to tag relevant cover letters
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    // Find JD IDs matching this marketplace job (if jobId provided)
    let relevantJdIds: number[] = [];
    if (jobId) {
      const matchingJds = await db
        .select({ id: jobDescriptionsTable.id })
        .from(jobDescriptionsTable)
        .where(
          and(
            eq(jobDescriptionsTable.userId, user.id),
            like(jobDescriptionsTable.url, `%/dashboard/jobs/${jobId}`)
          )
        );
      relevantJdIds = matchingJds.map((jd) => jd.id);
    }

    const coverLetters = await db
      .select({
        id: coverLettersTable.id,
        content: coverLettersTable.content,
        tone: coverLettersTable.tone,
        status: coverLettersTable.status,
        createdAt: coverLettersTable.createdAt,
        jobDescriptionId: coverLettersTable.jobDescriptionId,
        jobTitle: jobDescriptionsTable.title,
        jobCompany: jobDescriptionsTable.company,
      })
      .from(coverLettersTable)
      .innerJoin(
        jobDescriptionsTable,
        eq(coverLettersTable.jobDescriptionId, jobDescriptionsTable.id)
      )
      .where(eq(coverLettersTable.userId, user.id))
      .orderBy(desc(coverLettersTable.createdAt))
      .limit(50);

    const result = coverLetters.map((cl) => ({
      ...cl,
      isRelevant: relevantJdIds.includes(cl.jobDescriptionId),
    }));

    // Sort relevant first
    result.sort((a, b) => (a.isRelevant === b.isRelevant ? 0 : a.isRelevant ? -1 : 1));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching cover letters:", error);
    return NextResponse.json(
      { error: "Failed to fetch cover letters" },
      { status: 500 }
    );
  }
}
