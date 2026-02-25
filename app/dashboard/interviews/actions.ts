"use server";

import { db } from "@/src/db";
import { interviewSessionsTable } from "@/src/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteInterviewSession(sessionId: string) {
  try {
    await db
      .delete(interviewSessionsTable)
      .where(eq(interviewSessionsTable.id, sessionId));

    revalidatePath("/dashboard/interviews");
    return { success: true };
  } catch (error) {
    console.error("Error deleting interview session:", error);
    return { success: false, error: "Failed to delete interview session" };
  }
}

export async function deleteInterviewSessions(sessionIds: string[]) {
  try {
    if (sessionIds.length === 0) {
      return { success: false, error: "No sessions selected" };
    }

    await db
      .delete(interviewSessionsTable)
      .where(inArray(interviewSessionsTable.id, sessionIds));

    revalidatePath("/dashboard/interviews");
    return { success: true, count: sessionIds.length };
  } catch (error) {
    console.error("Error deleting interview sessions:", error);
    return { success: false, error: "Failed to delete interview sessions" };
  }
}
