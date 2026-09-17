import { parse as parseYaml } from "yaml";

export interface ToolFactsReach {
  filesystem?: string;
  network?: string;
  processes?: boolean;
}

export interface ToolFactsTool {
  name?: string;
  purpose?: string;
  side_effects?: string;
  reach?: ToolFactsReach;
  idempotent?: boolean;
}

export interface ToolFactsDoc {
  tool_facts_version?: string;
  name?: string;
  developer?: string;
  version?: string;
  status?: string;
  license?: string;
  kind?: string;
  homepage?: string;
  repository?: string;
  runtime?: {
    execution?: string;
    transport?: string;
  };
  credentials?: {
    required?: unknown[];
  };
  egress?: {
    telemetry?: string;
    destinations?: unknown[];
  };
  tools?: ToolFactsTool[];
  generated?: unknown;
  credits?: unknown;
  [key: string]: unknown;
}

export function extractFrontmatter(markdown: string): string {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(markdown);
  if (!match) throw new Error("TOOL_FACTS.md has no YAML frontmatter");
  return match[1];
}

export function parseToolFacts(source: unknown): ToolFactsDoc {
  if (typeof source === "string") {
    const parsed = parseYaml(extractFrontmatter(source));
    if (!parsed || typeof parsed !== "object") {
      throw new Error("TOOL_FACTS frontmatter is not an object");
    }
    return parsed as ToolFactsDoc;
  }
  if (source && typeof source === "object") {
    return source as ToolFactsDoc;
  }
  throw new Error("tool-facts source is not markdown or an object");
}

export function isToolFactsSource(source: unknown): boolean {
  if (typeof source === "string") {
    return source.startsWith("---");
  }
  if (!source || typeof source !== "object") return false;
  const rec = source as Record<string, unknown>;
  if (typeof rec.tool_facts_version === "string") return true;
  const tools = rec.tools;
  if (!Array.isArray(tools) || tools.length === 0) return false;
  const first = tools[0];
  return Boolean(first && typeof first === "object" && "side_effects" in first);
}
