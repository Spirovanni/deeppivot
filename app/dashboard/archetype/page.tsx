import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ArchetypePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold">Career Archetype</h1>
      <p className="mt-2 text-muted-foreground">
        Career archetype assessment coming soon. (LP6)
      </p>
    </div>
  );
}
