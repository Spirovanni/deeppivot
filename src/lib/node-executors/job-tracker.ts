import { db } from "@/src/db";
import { jobApplicationsTable } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import type { NodeExecutionContext, NodeExecutionResult } from "@/src/lib/integrations/types";

/**
 * Execute the Job Tracker node within a workflow.
 * Creates a new JobApplication in the specified column,
 * calculating order to push it to the bottom of the list.
 */
export async function executeJobTrackerNode(
  ctx: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const { userId, workflowId, config } = ctx;

  if (!config.columnId || !config.company || !config.position) {
    return {
      success: false,
      error: "Missing required fields: columnId, company, position",
    };
  }

  try {
    // Find the highest order in the target column, add 100 for spacing
    const lastJob = await db
      .select({ order: jobApplicationsTable.order })
      .from(jobApplicationsTable)
      .where(eq(jobApplicationsTable.columnId, parseInt(config.columnId)))
      .orderBy(desc(jobApplicationsTable.order))
      .limit(1);

    const newOrder = lastJob.length > 0 ? lastJob[0].order + 100 : 0;

    const [newJob] = await db
      .insert(jobApplicationsTable)
      .values({
        company: config.company,
        position: config.position,
        location: config.location || null,
        salary: config.salary || null,
        jobUrl: config.jobUrl || null,
        columnId: parseInt(config.columnId),
        userId,
        workflowId,
        order: newOrder,
        tags: config.tags ? config.tags.split(",").map((t) => t.trim()) : [],
      })
      .returning();

    return {
      success: true,
      data: { jobId: newJob.id, status: "created", order: newOrder },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to add job application: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
