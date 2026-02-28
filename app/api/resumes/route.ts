import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { userResumesTable, usersTable } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { extractResumeData } from "@/src/lib/llm/resume-parser";

const createResumeSchema = z.object({
    title: z.string().min(1, "Resume title is required").max(255),
    content: z.string().min(1, "Resume content is required"),
    fileUrl: z.string().url().max(1024).optional(),
});

export async function POST(req: Request) {
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

        const body = await req.json();
        const validatedData = createResumeSchema.parse(body);

        const [newResume] = await db
            .insert(userResumesTable)
            .values({
                userId: user.id,
                title: validatedData.title,
                rawText: validatedData.content,
                fileUrl: validatedData.fileUrl ?? null,
                status: "pending",
            })
            .returning();

        // Attempt LLM extraction
        try {
            const parsedData = await extractResumeData(validatedData.content);

            await db
                .update(userResumesTable)
                .set({
                    status: "extracted",
                    parsedData,
                    updatedAt: new Date(),
                })
                .where(eq(userResumesTable.id, newResume.id));
        } catch (extractionError) {
            console.error(`Failed to extract resume data for resume ${newResume.id}:`, extractionError);

            await db
                .update(userResumesTable)
                .set({
                    status: "failed",
                    updatedAt: new Date(),
                })
                .where(eq(userResumesTable.id, newResume.id));
        }

        const [final] = await db
            .select()
            .from(userResumesTable)
            .where(eq(userResumesTable.id, newResume.id))
            .limit(1);

        return NextResponse.json(final ?? newResume, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.flatten() },
                { status: 400 }
            );
        }

        console.error("Error creating resume:", error);
        return NextResponse.json(
            { error: "Failed to create resume" },
            { status: 500 }
        );
    }
}

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

        const resumes = await db
            .select()
            .from(userResumesTable)
            .where(eq(userResumesTable.userId, user.id))
            .orderBy(desc(userResumesTable.createdAt));

        return NextResponse.json(resumes);
    } catch (error) {
        console.error("Error fetching resumes:", error);
        return NextResponse.json(
            { error: "Failed to fetch resumes" },
            { status: 500 }
        );
    }
}
