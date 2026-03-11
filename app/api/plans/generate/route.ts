import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/src/db";
import {
  usersTable,
  userResumesTable,
  jobDescriptionsTable,
  careerMilestonesTable,
  careerResourcesTable,
  interviewSessionsTable,
  interviewFeedbackTable,
  educationProgramsTable,
  careerArchetypesTable,
} from "@/src/db/schema";
import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { mergeCareerPlanContext } from "@/src/lib/career-plan/merge-generation-context";
import { generateCareerPlan } from "@/src/lib/llm/career-plan-generator";
import { captureServerEvent } from "@/src/lib/posthog-server";
import type { ResumeExtraction } from "@/src/lib/llm/prompts/resumes";
import type { JobDescriptionExtraction } from "@/src/lib/llm/prompts/job-descriptions";

const generateRequestSchema = z.object({
  resumeId: z.coerce.number().int().positive(),
  jobDescriptionId: z.coerce.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ id: usersTable.id, clerkId: usersTable.clerkId })
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    const { resumeId, jobDescriptionId } = generateRequestSchema.parse(body);

    // Fetch all data in parallel
    const [resumeResult, jdResult, archetypeResult, interviewResult, programsResult] =
      await Promise.all([
        // Resume
        db
          .select({
            id: userResumesTable.id,
            parsedData: userResumesTable.parsedData,
            status: userResumesTable.status,
          })
          .from(userResumesTable)
          .where(
            and(
              eq(userResumesTable.id, resumeId),
              eq(userResumesTable.userId, user.id)
            )
          )
          .limit(1),

        // Job description
        db
          .select({
            id: jobDescriptionsTable.id,
            extractedData: jobDescriptionsTable.extractedData,
            status: jobDescriptionsTable.status,
          })
          .from(jobDescriptionsTable)
          .where(
            and(
              eq(jobDescriptionsTable.id, jobDescriptionId),
              eq(jobDescriptionsTable.userId, user.id)
            )
          )
          .limit(1),

        // Archetype
        db
          .select({
            archetypeName: careerArchetypesTable.archetypeName,
            strengths: careerArchetypesTable.strengths,
            growthAreas: careerArchetypesTable.growthAreas,
          })
          .from(careerArchetypesTable)
          .where(eq(careerArchetypesTable.userId, user.id))
          .limit(1),

        // Interview feedback (last 10 completed sessions)
        db
          .select({
            skillsMapping: interviewFeedbackTable.skillsMapping,
            content: interviewFeedbackTable.content,
          })
          .from(interviewFeedbackTable)
          .innerJoin(
            interviewSessionsTable,
            eq(interviewFeedbackTable.sessionId, interviewSessionsTable.id)
          )
          .where(
            and(
              eq(interviewSessionsTable.userId, user.id),
              eq(interviewSessionsTable.status, "completed")
            )
          )
          .orderBy(desc(interviewSessionsTable.startedAt))
          .limit(10),

        // Education programs (active, ordered by ROI)
        db
          .select({
            name: educationProgramsTable.name,
            provider: educationProgramsTable.provider,
            programType: educationProgramsTable.programType,
            duration: educationProgramsTable.duration,
            cost: educationProgramsTable.cost,
            roiScore: educationProgramsTable.roiScore,
            tags: educationProgramsTable.tags,
            url: educationProgramsTable.url,
          })
          .from(educationProgramsTable)
          .where(eq(educationProgramsTable.isActive, true))
          .orderBy(desc(educationProgramsTable.roiScore))
          .limit(15),
      ]);

    // Validate resume
    const resume = resumeResult[0];
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    if (resume.status !== "extracted" || !resume.parsedData) {
      return NextResponse.json(
        { error: "Resume data has not been extracted yet. Please wait for processing to complete." },
        { status: 400 }
      );
    }

    // Validate JD
    const jd = jdResult[0];
    if (!jd) {
      return NextResponse.json({ error: "Job description not found" }, { status: 404 });
    }
    if (jd.status !== "extracted" || !jd.extractedData) {
      return NextResponse.json(
        { error: "Job description data has not been extracted yet. Please wait for processing to complete." },
        { status: 400 }
      );
    }

    // Aggregate interview insights
    const allSkillScores: Array<{ skill: string; score: number; note?: string }> = [];
    const feedbackSummaries: string[] = [];
    for (const fb of interviewResult) {
      const mapping = fb.skillsMapping as Array<{ skill: string; score: number; note?: string }> | null;
      if (Array.isArray(mapping)) {
        allSkillScores.push(...mapping);
      }
      if (fb.content) {
        feedbackSummaries.push(fb.content.slice(0, 500));
      }
    }

    // Average skill scores across sessions
    const skillAverages = new Map<string, { total: number; count: number; note?: string }>();
    for (const s of allSkillScores) {
      const existing = skillAverages.get(s.skill);
      if (existing) {
        existing.total += s.score;
        existing.count += 1;
      } else {
        skillAverages.set(s.skill, { total: s.score, count: 1, note: s.note });
      }
    }
    const averagedSkills = Array.from(skillAverages.entries()).map(([skill, { total, count, note }]) => ({
      skill,
      score: Math.round(total / count),
      note,
    }));

    // Merge context
    const context = mergeCareerPlanContext(
      resume.parsedData as ResumeExtraction,
      jd.extractedData as JobDescriptionExtraction,
      archetypeResult[0] ?? null,
      averagedSkills.length > 0 || feedbackSummaries.length > 0
        ? { skills: averagedSkills, feedbackSummaries }
        : null,
      programsResult
    );

    // Generate career plan via LLM
    const plan = await generateCareerPlan(context);

    // Compute starting orderIndex
    const existingMilestones = await db
      .select({ orderIndex: careerMilestonesTable.orderIndex })
      .from(careerMilestonesTable)
      .where(eq(careerMilestonesTable.userId, user.id))
      .orderBy(asc(careerMilestonesTable.orderIndex));

    const startIndex =
      existingMilestones.length > 0
        ? existingMilestones[existingMilestones.length - 1].orderIndex + 1
        : 0;

    // Insert milestones
    const now = new Date();
    const milestoneValues = plan.milestones.map((m, i) => ({
      userId: user.id,
      title: m.title,
      description: m.description,
      targetDate: new Date(now.getTime() + m.targetWeeksFromNow * 7 * 24 * 60 * 60 * 1000),
      status: "planned" as const,
      orderIndex: startIndex + i,
    }));

    const insertedMilestones = await db
      .insert(careerMilestonesTable)
      .values(milestoneValues)
      .returning();

    // Insert resources for each milestone
    const resourceInserts: Array<{
      milestoneId: number;
      title: string;
      url: string;
      resourceType: string;
    }> = [];

    for (let i = 0; i < insertedMilestones.length; i++) {
      const milestone = insertedMilestones[i];
      const resources = plan.milestones[i].suggestedResources ?? [];
      for (const r of resources) {
        resourceInserts.push({
          milestoneId: milestone.id,
          title: r.title,
          url: r.url,
          resourceType: r.resourceType,
        });
      }
    }

    if (resourceInserts.length > 0) {
      await db.insert(careerResourcesTable).values(resourceInserts);
    }

    // Fetch complete milestones with resources
    const insertedIds = insertedMilestones.map((m) => m.id);
    const resultMilestones = await db.query.careerMilestonesTable.findMany({
      where: inArray(careerMilestonesTable.id, insertedIds),
      orderBy: [asc(careerMilestonesTable.orderIndex)],
      with: {
        resources: {
          orderBy: [asc(careerResourcesTable.createdAt)],
        },
      },
    });

    // Analytics
    captureServerEvent({
      distinctId: clerkId,
      event: "career_plan_ai_generated",
      properties: {
        milestoneCount: insertedMilestones.length,
        resumeId,
        jobDescriptionId,
        hasArchetype: !!archetypeResult[0],
        interviewSessionsUsed: interviewResult.length,
      },
    }).catch(() => {});

    return NextResponse.json(
      {
        planSummary: plan.planSummary,
        milestones: resultMilestones,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("[api/plans/generate] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate career plan" },
      { status: 500 }
    );
  }
}
