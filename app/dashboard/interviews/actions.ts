"use server";

import { db } from "@/src/db";
import { interviewSessionsTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
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
