import { requireEmployer } from "@/src/lib/rbac";

export default async function EmployerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireEmployer();
    return <>{children}</>;
}
