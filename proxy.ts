import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Route matchers
// ---------------------------------------------------------------------------

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/clerk-webhook(.*)",
  "/api/clerk-proxy(.*)",
  "/api/clerk-js(.*)",
  "/unauthorized",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

const isEmployerRoute = createRouteMatcher([
  "/employer(.*)",
  "/api/employer(.*)",
]);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes without any auth check
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  await auth.protect();

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Role-gated routes require a DB lookup
  if (isAdminRoute(request) || isEmployerRoute(request)) {
    try {
      const [user] = await db
        .select({ role: usersTable.role, isSuspended: usersTable.isSuspended, isActive: usersTable.isActive })
        .from(usersTable)
        .where(eq(usersTable.clerkId, userId))
        .limit(1);

      if (!user || user.isSuspended || !user.isActive) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      if (isAdminRoute(request) && user.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      if (isEmployerRoute(request) && !["admin", "employer"].includes(user.role)) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
