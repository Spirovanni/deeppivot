"use server";

import { db } from "@/src/db";
import { agentConfigsTable, usersTable } from "@/src/db/schema";
import { and, eq, or, isNull, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AgentConfig = typeof agentConfigsTable.$inferSelect;

export type CreateAgentConfigInput = {
  name: string;
  systemPrompt: string;
  interviewType?: string;
  voiceId?: string;
  elevenLabsAgentId?: string;
  isDefault?: boolean;
  isPublic?: boolean;
};

export type UpdateAgentConfigInput = Partial<CreateAgentConfigInput>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getDbUserId(): Promise<number> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);

  if (!user) throw new Error("User not found");
  return user.id;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Return all agent configs available to the current user:
 * their own configs + all public (system) presets.
 */
export async function listAgentConfigs(): Promise<AgentConfig[]> {
  const userId = await getDbUserId();

  return db
    .select()
    .from(agentConfigsTable)
    .where(
      or(
        eq(agentConfigsTable.userId, userId),
        and(isNull(agentConfigsTable.userId), eq(agentConfigsTable.isPublic, true))
      )
    )
    .orderBy(desc(agentConfigsTable.isDefault), desc(agentConfigsTable.createdAt));
}

/**
 * Return a single config owned by (or publicly shared with) the current user.
 */
export async function getAgentConfig(id: number): Promise<AgentConfig | null> {
  const userId = await getDbUserId();

  const [config] = await db
    .select()
    .from(agentConfigsTable)
    .where(
      and(
        eq(agentConfigsTable.id, id),
        or(
          eq(agentConfigsTable.userId, userId),
          and(isNull(agentConfigsTable.userId), eq(agentConfigsTable.isPublic, true))
        )
      )
    )
    .limit(1);

  return config ?? null;
}

/**
 * Resolve the active agent config for a given interview type.
 *
 * Priority order:
 *   1. User's custom default config for this interviewType
 *   2. User's custom default config (any type)
 *   3. Public system preset for this interviewType
 *   4. null (caller should fall back to env-var agent ID)
 */
export async function resolveAgentConfig(
  interviewType: string
): Promise<AgentConfig | null> {
  const userId = await getDbUserId();

  // 1. User's default for this exact interview type
  const [typed] = await db
    .select()
    .from(agentConfigsTable)
    .where(
      and(
        eq(agentConfigsTable.userId, userId),
        eq(agentConfigsTable.isDefault, true),
        eq(agentConfigsTable.interviewType, interviewType)
      )
    )
    .limit(1);
  if (typed) return typed;

  // 2. User's catch-all default
  const [userDefault] = await db
    .select()
    .from(agentConfigsTable)
    .where(
      and(eq(agentConfigsTable.userId, userId), eq(agentConfigsTable.isDefault, true))
    )
    .limit(1);
  if (userDefault) return userDefault;

  // 3. Public system preset for this interview type
  const [systemPreset] = await db
    .select()
    .from(agentConfigsTable)
    .where(
      and(
        isNull(agentConfigsTable.userId),
        eq(agentConfigsTable.isPublic, true),
        eq(agentConfigsTable.interviewType, interviewType)
      )
    )
    .limit(1);
  if (systemPreset) return systemPreset;

  return null;
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createAgentConfig(
  input: CreateAgentConfigInput
): Promise<AgentConfig> {
  const userId = await getDbUserId();

  // If this new config is being set as default, clear existing defaults for the same type
  if (input.isDefault) {
    await db
      .update(agentConfigsTable)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(agentConfigsTable.userId, userId),
          eq(agentConfigsTable.isDefault, true),
          eq(agentConfigsTable.interviewType, input.interviewType ?? "general")
        )
      );
  }

  const [created] = await db
    .insert(agentConfigsTable)
    .values({
      userId,
      name: input.name,
      systemPrompt: input.systemPrompt,
      interviewType: input.interviewType ?? "general",
      voiceId: input.voiceId ?? null,
      elevenLabsAgentId: input.elevenLabsAgentId ?? null,
      isDefault: input.isDefault ?? false,
      isPublic: input.isPublic ?? false,
    })
    .returning();

  revalidatePath("/dashboard/settings/agent-configs");
  return created;
}

export async function updateAgentConfig(
  id: number,
  input: UpdateAgentConfigInput
): Promise<AgentConfig> {
  const userId = await getDbUserId();

  // Ownership check — only the owner can update
  const [existing] = await db
    .select({ id: agentConfigsTable.id, userId: agentConfigsTable.userId })
    .from(agentConfigsTable)
    .where(and(eq(agentConfigsTable.id, id), eq(agentConfigsTable.userId, userId)))
    .limit(1);

  if (!existing) throw new Error("Agent config not found or access denied");

  // Clear existing defaults for the same type before promoting this one
  if (input.isDefault) {
    await db
      .update(agentConfigsTable)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(agentConfigsTable.userId, userId),
          eq(agentConfigsTable.isDefault, true)
        )
      );
  }

  const [updated] = await db
    .update(agentConfigsTable)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(agentConfigsTable.id, id))
    .returning();

  revalidatePath("/dashboard/settings/agent-configs");
  return updated;
}

export async function deleteAgentConfig(id: number): Promise<void> {
  const userId = await getDbUserId();

  const deleted = await db
    .delete(agentConfigsTable)
    .where(and(eq(agentConfigsTable.id, id), eq(agentConfigsTable.userId, userId)))
    .returning();

  if (deleted.length === 0) throw new Error("Agent config not found or access denied");

  revalidatePath("/dashboard/settings/agent-configs");
}

// ─── System preset seeder (admin only) ───────────────────────────────────────

/**
 * Upsert a system-level (userId=null, isPublic=true) agent config.
 * Called from admin tooling or a seed script — NOT user-facing.
 */
export async function upsertSystemPreset(
  interviewType: string,
  preset: Omit<CreateAgentConfigInput, "isPublic" | "isDefault">
): Promise<AgentConfig> {
  const [existing] = await db
    .select({ id: agentConfigsTable.id })
    .from(agentConfigsTable)
    .where(
      and(
        isNull(agentConfigsTable.userId),
        eq(agentConfigsTable.interviewType, interviewType)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(agentConfigsTable)
      .set({ ...preset, updatedAt: new Date() })
      .where(eq(agentConfigsTable.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(agentConfigsTable)
    .values({
      userId: null,
      isPublic: true,
      isDefault: false,
      interviewType,
      ...preset,
    })
    .returning();

  return created;
}
