import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { userResumesTable, usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import pdfParse from "pdf-parse";
import { uploadToR2 } from "@/src/lib/storage";
import { extractResumeData } from "@/src/lib/llm/resume-parser";
import { syncProfileFromResume } from "@/src/lib/user/profile-sync";
import { embedText } from "@/src/lib/embeddings";
import { buildResumeEmbeddingText } from "@/src/lib/resume-embeddings";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
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

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const title = (formData.get("title") as string | null)?.trim();

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text from PDF
        const pdfData = await pdfParse(buffer);
        const rawText = pdfData.text?.trim();

        if (!rawText) {
            return NextResponse.json(
                { error: "No text could be extracted from this PDF" },
                { status: 422 }
            );
        }

        // Upload PDF to R2 for persistent storage
        const r2Key = `resumes/${user.id}/resume-${Date.now()}.pdf`;
        const fileUrl = await uploadToR2(r2Key, buffer, "application/pdf");

        // Derive title from filename if not provided
        const resumeTitle = title || file.name.replace(/\.pdf$/i, "") || "Untitled Resume";

        // Create resume record
        const [newResume] = await db
            .insert(userResumesTable)
            .values({
                userId: user.id,
                title: resumeTitle,
                rawText,
                fileUrl,
                status: "pending",
            })
            .returning();

        // Attempt LLM extraction of structured data + embedding generation
        try {
            const parsedData = await extractResumeData(rawText);
            const embeddingText = buildResumeEmbeddingText({
                title: resumeTitle,
                rawText,
                parsedData,
            });

            let embeddingVector: number[] | null = null;
            try {
                const { embedding } = await embedText(embeddingText);
                embeddingVector = embedding;
            } catch (embErr) {
                console.warn(
                    `Failed to generate resume embedding for resume ${newResume.id}:`,
                    embErr
                );
            }

            await db
                .update(userResumesTable)
                .set({
                    status: "extracted",
                    parsedData,
                    embeddingVector,
                    updatedAt: new Date(),
                })
                .where(eq(userResumesTable.id, newResume.id));

            // Sync profile fields from extracted data (deeppivot-216)
            if (parsedData) {
                await syncProfileFromResume(user.id, parsedData);
            }
        } catch (extractionError) {
            console.error(
                `Failed to extract resume data for resume ${newResume.id}:`,
                extractionError
            );

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

        return NextResponse.json(final ?? { ...newResume, fileUrl }, { status: 201 });
    } catch (error) {
        console.error("Error uploading resume:", error);
        return NextResponse.json(
            { error: "Failed to upload resume" },
            { status: 500 }
        );
    }
}
