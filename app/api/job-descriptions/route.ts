import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { jobDescriptionsTable, usersTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { extractJobDescriptionData } from "@/lib/llm/job-description-parser";

const createJobDescriptionSchema = z.object({
    title: z.string().min(1, "Job title is required").max(255),
    company: z.string().max(255).optional(),
    content: z.string().min(1, "Job description content is required"),
    url: z.string().url("Must be a valid URL").max(1024).optional().or(z.literal("")),
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

        // Parse the request body
        const body = await req.json();

        // Convert empty string url to undefined so Zod doesn't trip if literal("") fails
        if (body.url === "") {
            body.url = undefined;
        }

        const validatedData = createJobDescriptionSchema.parse(body);

        const [newJobDesc] = await db
            .insert(jobDescriptionsTable)
            .values({
                userId: user.id,
                title: validatedData.title,
                company: validatedData.company,
                content: validatedData.content,
                url: validatedData.url,
                status: "pending", // Initially pending extraction
            })
            .returning();

        // Attempt Extraction
        try {
            const extractedData = await extractJobDescriptionData(validatedData.content);

            await db
                .update(jobDescriptionsTable)
                .set({
                    status: "extracted",
                    extractedData: extractedData,
                    updatedAt: new Date(),
                })
                .where(eq(jobDescriptionsTable.id, newJobDesc.id));
        } catch (extractionError) {
            console.error(`Failed to extract job description data for job ${newJobDesc.id}:`, extractionError);

            await db
                .update(jobDescriptionsTable)
                .set({
                    status: "failed",
                    updatedAt: new Date(),
                })
                .where(eq(jobDescriptionsTable.id, newJobDesc.id));
        }

        return NextResponse.json(
            { success: true, id: newJobDesc.id },
            { status: 201 }
        );
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: (error as any).errors },
                { status: 400 }
            );
        }

        console.error("Error creating job description:", error);
        return NextResponse.json(
            { error: "Failed to create job description" },
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

        const jobDescriptions = await db
            .select()
            .from(jobDescriptionsTable)
            .where(eq(jobDescriptionsTable.userId, user.id))
            .orderBy(desc(jobDescriptionsTable.createdAt));

        return NextResponse.json(jobDescriptions);
    } catch (error) {
        console.error("Error fetching job descriptions:", error);
        return NextResponse.json(
            { error: "Failed to fetch job descriptions" },
            { status: 500 }
        );
    }
}
