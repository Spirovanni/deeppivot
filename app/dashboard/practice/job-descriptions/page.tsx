import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { jobDescriptionsTable, usersTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { JobDescriptionsClient } from "./JobDescriptionsClient";

export const metadata = {
    title: "Job Descriptions | DeepPivot",
    description: "Manage your saved job descriptions for targeted interview practice.",
};

export default async function JobDescriptionsPage() {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        redirect("/sign-in");
    }

    // 1. Get user UUID
    const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.clerkId, clerkId))
        .limit(1);

    if (!user) {
        redirect("/onboarding");
    }

    // 2. Fetch all job descriptions for this user natively, ordered newest first
    const jobs = await db
        .select()
        .from(jobDescriptionsTable)
        .where(eq(jobDescriptionsTable.userId, user.id))
        .orderBy(desc(jobDescriptionsTable.createdAt));

    return (
        <div className="flex-1 flex w-full flex-col">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 font-display">
                                Job Descriptions
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage your saved job descriptions to tailor your mock interviews and improve performance.
                            </p>
                        </div>
                        {/* The upload/add modal will hook into this button area later via the client */}
                    </div>
                </div>
            </div>

            <div className="flex-1 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                {/* Pass initial payload to Client component for reactivity */}
                <JobDescriptionsClient initialJobs={jobs} />
            </div>
        </div>
    );
}
