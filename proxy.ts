import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/hume-token',
  '/api/clerk-webhook',
  '/api/clerk-js',
  '/api/clerk-proxy(.*)',
  '/api/sync-users'
]);

export default clerkMiddleware(async (auth, req) => {
  // Redirect www to apex domain (only in production, not localhost)
  const url = req.nextUrl.clone();
  if (url.hostname.startsWith('www.') && !url.hostname.includes('localhost')) {
    url.hostname = url.hostname.replace(/^www\./, '');
    return Response.redirect(url, 301);
  }

  // Protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
