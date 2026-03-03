import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/src/lib/admin-auth";
import { Shield, ArrowLeft } from "lucide-react";

const NAV_LINKS = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/agents", label: "Agent Configs" },
  { href: "/admin/archetype-review", label: "Archetype Review" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/employers", label: "Employers" },
  { href: "/admin/blog", label: "Blog Manager" },
  { href: "/admin/gamification", label: "Gamification" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/30">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 font-semibold text-foreground"
            >
              <Shield className="size-5" />
              Admin
            </Link>
            <nav className="flex gap-3 text-sm text-muted-foreground overflow-x-auto">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Home
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
