import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function EducationPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold">Education Explorer</h1>
      <p className="mt-2 text-muted-foreground">
        Bootcamps, certifications, and funding opportunities coming soon. (LP9)
      </p>
    </div>
  );
}
