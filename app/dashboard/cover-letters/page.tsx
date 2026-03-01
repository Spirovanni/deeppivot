import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { userResumesTable, jobDescriptionsTable, usersTable, coverLettersTable } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { CoverLetterGenerator } from "@/components/cover-letter/CoverLetterGenerator";

export const metadata = {
    title: "Cover Letters | DeepPivot",
    description: "Generate and manage personalized cover letters.",
};

export default async function CoverLettersPage() {
    const { userId: clerkId } = await auth();

    if (!clerkId) redirect("/sign-in");

    const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.clerkId, clerkId))
        .limit(1);

    if (!user) redirect("/sign-in");

    const resumes = await db
        .select({
            id: userResumesTable.id,
            title: userResumesTable.title,
            status: userResumesTable.status,
            isDefault: userResumesTable.isDefault,
        })
        .from(userResumesTable)
        .where(eq(userResumesTable.userId, user.id))
        .orderBy(desc(userResumesTable.createdAt));

    const jobDescriptions = await db
        .select({
            id: jobDescriptionsTable.id,
            title: jobDescriptionsTable.title,
            company: jobDescriptionsTable.company,
        })
        .from(jobDescriptionsTable)
        .where(eq(jobDescriptionsTable.userId, user.id))
        .orderBy(desc(jobDescriptionsTable.createdAt))
        .limit(20);

    const history = await db
        .select({
            id: coverLettersTable.id,
            content: coverLettersTable.content,
            tone: coverLettersTable.tone,
            createdAt: coverLettersTable.createdAt,
            jobTitle: jobDescriptionsTable.title,
        })
        .from(coverLettersTable)
        .innerJoin(
            jobDescriptionsTable,
            eq(coverLettersTable.jobDescriptionId, jobDescriptionsTable.id)
        )
        .where(eq(coverLettersTable.userId, user.id))
        .orderBy(desc(coverLettersTable.createdAt))
        .limit(10);

    return (
        <div className="flex flex-1 flex-col w-full">
            <div className="border-b bg-background">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold tracking-tight">Cover Letters</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Generate and refine personalized cover letters for your job applications.
                    </p>
                </div>
            </div>

            <div className="flex-1 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <CoverLetterGenerator
                        resumes={resumes}
                        jobDescriptions={jobDescriptions}
                        history={history}
                    />
                </div>
            </div>
        </div>
    );
}
