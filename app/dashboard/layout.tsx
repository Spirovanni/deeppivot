import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
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
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
