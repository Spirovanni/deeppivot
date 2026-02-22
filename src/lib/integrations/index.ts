import type { IntegrationConfig, NodeExecutionContext, NodeExecutionResult } from "./types";
import { jobTrackerIntegration } from "./job-tracker";
import { vapiIntegration } from "./vapi";
import { executeJobTrackerNode } from "@/src/lib/node-executors/job-tracker";
import { executeVapiNode } from "@/src/lib/node-executors/vapi";

/** Registry of all available integrations keyed by provider name */
const integrations: Record<string, IntegrationConfig> = {
  [jobTrackerIntegration.provider]: jobTrackerIntegration,
  [vapiIntegration.provider]: vapiIntegration,
};

/** Map of provider -> executor function */
const executors: Record<
  string,
  (ctx: NodeExecutionContext) => Promise<NodeExecutionResult>
> = {
  job_tracker: executeJobTrackerNode,
  vapi: executeVapiNode,
};

export function getIntegration(provider: string): IntegrationConfig | undefined {
  return integrations[provider];
}

export function getAllIntegrations(): IntegrationConfig[] {
  return Object.values(integrations);
}

export async function executeNode(
  provider: string,
  ctx: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const executor = executors[provider];
  if (!executor) {
    return { success: false, error: `No executor found for provider: ${provider}` };
  }
  return executor(ctx);
}

export type { IntegrationConfig, ConfigField, ConfigFieldType, SelectOption, NodeExecutionContext, NodeExecutionResult } from "./types";
