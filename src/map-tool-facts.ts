import { collapseStated } from "./collapse.ts";
import { rowLabel, severityFor } from "./spec.ts";
import type { PanelRow, RowType, RowValue } from "./types.ts";
import type { ToolFactsDoc, ToolFactsTool } from "./parse-tool-facts.ts";

function row(key: string, value: RowValue, type?: RowType): PanelRow {
  const t: RowType = value === "undisclosed" ? "undisclosed" : (type ?? "enum");
  return {
    key,
    label: rowLabel(key),
    value,
    type: t,
    severity: severityFor(key, value),
  };
}

function credentials(doc: ToolFactsDoc): RowValue {
  const required = doc.credentials?.required;
  if (!Array.isArray(required)) return "undisclosed";
  return required.length === 0 ? "none" : "required";
}

function egressDestinations(doc: ToolFactsDoc): RowValue {
  const dests = doc.egress?.destinations;
  if (!Array.isArray(dests)) return "undisclosed";
  if (dests.length === 0) return "none";
  if (dests.some((d) => d === "undisclosed")) return "undisclosed";
  return "named";
}

function collapseTools<T>(
  tools: ToolFactsTool[],
  key: string,
  read: (t: ToolFactsTool) => T | undefined,
  harshest: T,
): T | "undisclosed" {
  const stated: T[] = [];
  let silent = false;
  for (const t of tools) {
    const value = read(t);
    if (value === undefined) {
      silent = true;
      continue;
    }
    stated.push(value);
  }
  return collapseStated(key, stated, silent, harshest);
}

export function mapToolFactsRows(doc: ToolFactsDoc): PanelRow[] {
  const tools = doc.tools ?? [];
  const kind = doc.kind === "mcp-server" ? "mcp-server" : "undisclosed";
  const runtime = doc.runtime?.execution ?? "undisclosed";
  const transport = doc.runtime?.transport ?? "undisclosed";
  const telemetry = doc.egress?.telemetry ?? "undisclosed";
  const license = typeof doc.license === "string" && doc.license.length > 0
    ? doc.license
    : "undisclosed";

  return [
    row("kind", kind),
    row("runtime", runtime),
    row("transport", transport),
    row("credentials", credentials(doc)),
    row(
      "side_effects_worst",
      collapseTools(tools, "side_effects_worst", (t) => t.side_effects as "none" | "read" | "write" | "destructive" | undefined, "destructive"),
    ),
    row(
      "filesystem",
      collapseTools(tools, "filesystem", (t) => t.reach?.filesystem as "none" | "read" | "scoped" | "read-write" | undefined, "read-write"),
    ),
    row(
      "network",
      collapseTools(tools, "network", (t) => t.reach?.network as "none" | "allowlist" | "unrestricted" | undefined, "unrestricted"),
    ),
    row(
      "processes",
      collapseTools(tools, "processes", (t) => t.reach?.processes, true),
    ),
    row("egress_destinations", egressDestinations(doc)),
    row("telemetry", telemetry),
    row(
      "idempotent",
      collapseTools(tools, "idempotent", (t) => t.idempotent, false),
    ),
    row("license", license, "scalar"),
  ];
}

function present(value: unknown): boolean {
  return value !== undefined;
}

export function unmappedToolFactsFields(doc: ToolFactsDoc): string[] {
  const found = new Set<string>();
  for (const key of [
    "tool_facts_version",
    "name",
    "developer",
    "version",
    "status",
    "homepage",
    "repository",
    "generated",
    "credits",
  ]) {
    if (present(doc[key])) found.add(key);
  }
  for (const t of doc.tools ?? []) {
    if (present(t.name)) found.add("tools[].name");
    if (present(t.purpose)) found.add("tools[].purpose");
  }
  if (Array.isArray(doc.credentials?.required) && doc.credentials.required.length > 0) {
    found.add("credentials.required[]");
  }
  if (Array.isArray(doc.egress?.destinations) && doc.egress.destinations.some((d) => d !== "undisclosed")) {
    found.add("egress.destinations[]");
  }
  return [...found].sort();
}
