import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="mt-2 text-muted-foreground">
        Performance analytics dashboard coming soon. (LP5)
      </p>
    </div>
  );
}
