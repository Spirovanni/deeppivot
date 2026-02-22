/**
 * Epicflow Integration Type System
 *
 * Defines the config shape for visual nodes on the Epicflow canvas.
 * Each integration declares its provider name, config fields (with
 * types and placeholders), and an executor reference.
 */

export type ConfigFieldType = "text" | "select" | "number" | "textarea";

export interface SelectOption {
  label: string;
  value: string;
}

export interface ConfigField {
  /** Machine-readable key used in the config object at execution time */
  key: string;
  /** Human-readable label shown in the node's config panel */
  label: string;
  /** Input type rendered in the UI */
  type: ConfigFieldType;
  /** Placeholder text — supports mustache syntax e.g. {{gmail.company}} */
  placeholder?: string;
  /** Whether this field must be filled before execution */
  required?: boolean;
  /** Default value for the field */
  defaultValue?: string;
  /** Options for 'select' type fields */
  options?: SelectOption[];
}

export interface IntegrationConfig {
  /** Unique provider identifier used to look up the integration */
  provider: string;
  /** Display name shown on the canvas node */
  displayName: string;
  /** Short description shown in the node picker */
  description: string;
  /** Icon identifier (maps to @tabler/icons-react or lucide-react) */
  icon: string;
  /** Category for grouping in the node picker */
  category: "productivity" | "communication" | "data" | "ai" | "custom";
  /** Config fields rendered in the node's settings panel */
  configFields: ConfigField[];
}

export interface NodeExecutionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface NodeExecutionContext {
  nodeId: string;
  userId: number;
  workflowId: string;
  config: Record<string, string>;
}
