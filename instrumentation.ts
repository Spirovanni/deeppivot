/**
 * Next.js instrumentation hook
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Loaded once per Node.js/Edge worker startup. Initializes:
 *   - Sentry (error tracking + tracing)
 *   - Axiom (structured logging, via @axiomhq/nextjs)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Sentry error handler for App Router server components
export const onRequestError = async (
  err: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any,
  context: { routerKind: string; routePath: string; routeType: string }
) => {
  const { captureRequestError } = await import("@sentry/nextjs");
  captureRequestError(err, request, context);
};
