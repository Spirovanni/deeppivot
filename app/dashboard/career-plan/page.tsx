import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { CareerPlanClient } from "@/components/career-plan/CareerPlanClient";
import { getWdbStatus } from "@/src/lib/actions/wdb-career-plan";
import { WdbCareerPlanBanner } from "@/components/career-plan/WdbCareerPlanBanner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Plan | Deep Pivot",
};

export const dynamic = "force-dynamic";

export default async function CareerPlanPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [dbUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, user.id))
    .limit(1);

  if (!dbUser) redirect("/sign-in");

  const wdbStatus = await getWdbStatus().catch(() => null);

  return (
    <>
      {wdbStatus?.isWdbClient && (
        <WdbCareerPlanBanner wdbStatus={wdbStatus} />
      )}
      <CareerPlanClient />
    </>
  );
}
