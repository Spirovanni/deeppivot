/**
 * Inngest client for background jobs and event-driven workflows.
 *
 * Env: INNGEST_EVENT_KEY (optional, for production)
 */

import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "deeppivot",
  name: "DeepPivot",
});
