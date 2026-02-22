"use server";

import { db } from "@/src/db";
import { jobBoardsTable, jobColumnsTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_COLUMNS = [
  { name: "Wishlist", order: 0 },
  { name: "Applied", order: 1 },
  { name: "Interviewing", order: 2 },
  { name: "Offer", order: 3 },
  { name: "Rejected", order: 4 },
] as const;

/**
 * Initialize a default Job Board for a new user.
 * Creates an "Automated Job Hunt" board with 5 default columns.
 * Safe to call multiple times — returns the existing board if one exists.
 */
export async function initializeJobBoard(userId: number) {
  // Check for existing board to prevent duplicates
  const existing = await db
    .select()
    .from(jobBoardsTable)
    .where(eq(jobBoardsTable.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create the board
  const [board] = await db
    .insert(jobBoardsTable)
    .values({
      name: "Automated Job Hunt",
      userId,
    })
    .returning();

  // Create default columns for the board
  await db.insert(jobColumnsTable).values(
    DEFAULT_COLUMNS.map((col) => ({
      name: col.name,
      order: col.order,
      boardId: board.id,
    }))
  );

  return board;
}
