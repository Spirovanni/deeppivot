"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = { pendingAnnouncementId: number | null };

/**
 * When admin sends an announcement with "Send to Home", redirect users to it
 * until they dismiss it (deeppivot-257).
 */
export function SendToHomeRedirect({ pendingAnnouncementId }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pendingAnnouncementId) return;
    const announcementPath = `/dashboard/announcements/${pendingAnnouncementId}`;
    if (pathname === announcementPath) return;
    if (pathname.startsWith("/dashboard")) {
      router.replace(announcementPath);
    }
  }, [pendingAnnouncementId, pathname, router]);

  return null;
}
