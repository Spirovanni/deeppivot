import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { ensureUserInDb } from "@/src/lib/actions/ensure-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  await ensureUserInDb();

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <DashboardSidebar />
      <main className="flex flex-1 flex-col overflow-auto">
        <DashboardTopBar />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
