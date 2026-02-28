import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { userResumesTable, usersTable } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { ResumesClient } from "./ResumesClient";

export const metadata = {
    title: "Resumes | DeepPivot",
    description: "Manage your resumes for cover letters and interview practice.",
};

export default async function ResumesPage() {
    const { userId: clerkId } = await auth();

    if (!clerkId) redirect("/sign-in");

    const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.clerkId, clerkId))
        .limit(1);

    if (!user) redirect("/sign-in");

    const rows = await db
        .select({
            id: userResumesTable.id,
            title: userResumesTable.title,
            fileUrl: userResumesTable.fileUrl,
            status: userResumesTable.status,
            isDefault: userResumesTable.isDefault,
            createdAt: userResumesTable.createdAt,
        })
        .from(userResumesTable)
        .where(eq(userResumesTable.userId, user.id))
        .orderBy(desc(userResumesTable.createdAt));

    const resumes = rows.map((r) => ({
        id: r.id,
        title: r.title,
        fileUrl: r.fileUrl,
        status: r.status,
        isDefault: r.isDefault,
        createdAt: r.createdAt,
    }));

    return (
        <div className="flex flex-1 flex-col w-full">
            <div className="border-b bg-background">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold tracking-tight">Resumes</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage your resumes for cover letters and context-aware interview practice.
                    </p>
                </div>
            </div>

            <div className="flex-1 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <ResumesClient initialResumes={resumes} />
                </div>
            </div>
        </div>
    );
}
