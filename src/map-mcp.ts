import { harshness, rowLabel, severityFor } from "./spec.ts";
import type {
  FetchContext,
  McpTool,
  McpToolsListResult,
  PanelRow,
  RowType,
  RowValue,
  TransportKind,
} from "./types.ts";

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

function collapseStated<T>(
  key: string,
  stated: T[],
  silent: boolean,
  harshest: T,
): T | "undisclosed" {
  if (stated.length === 0) return "undisclosed";
  let worst = stated[0];
  for (const v of stated.slice(1)) {
    if (harshness(key, v) > harshness(key, worst)) worst = v;
  }
  if (silent && worst !== harshest) return "undisclosed";
  return worst;
}

function sideEffects(tools: McpTool[]): RowValue {
  const stated: Array<"read" | "write" | "destructive"> = [];
  let silent = false;
  for (const t of tools) {
    const a = t.annotations;
    if (!a || (a.destructiveHint === undefined && a.readOnlyHint === undefined)) {
      silent = true;
      continue;
    }
    if (a.destructiveHint === true) stated.push("destructive");
    else if (a.readOnlyHint === true) stated.push("read");
    else if (a.readOnlyHint === false) stated.push("write");
    else silent = true;
  }
  return collapseStated("side_effects_worst", stated, silent, "destructive");
}

function network(tools: McpTool[]): RowValue {
  const stated: Array<"unrestricted"> = [];
  let silent = false;
  for (const t of tools) {
    const hint = t.annotations?.openWorldHint;
    if (hint === true) stated.push("unrestricted");
    else silent = true;
  }
  return collapseStated("network", stated, silent, "unrestricted");
}

function idempotent(tools: McpTool[]): RowValue {
  const stated: boolean[] = [];
  let silent = false;
  for (const t of tools) {
    const hint = t.annotations?.idempotentHint;
    if (typeof hint === "boolean") stated.push(hint);
    else silent = true;
  }
  return collapseStated("idempotent", stated, silent, false);
}

function runtimeFromTransport(transport?: TransportKind): RowValue {
  if (transport === "stdio") return "local-process";
  if (transport === "sse" || transport === "streamable-http") return "remote-service";
  return "undisclosed";
}

export function mapMcpRows(result: McpToolsListResult, ctx: FetchContext): PanelRow[] {
  const tools = result.tools ?? [];
  return [
    row("kind", "mcp-server"),
    row("runtime", runtimeFromTransport(ctx.transport)),
    row("transport", ctx.transport ?? "undisclosed"),
    row("credentials", "undisclosed"),
    row("side_effects_worst", sideEffects(tools)),
    row("filesystem", "undisclosed"),
    row("network", network(tools)),
    row("processes", "undisclosed"),
    row("egress_destinations", "undisclosed"),
    row("telemetry", "undisclosed"),
    row("idempotent", idempotent(tools)),
    row("license", "undisclosed", "scalar"),
  ];
}

function present(value: unknown): boolean {
  return value !== undefined;
}

/** JSON-path style field names present in the source and not represented as rows. */
export function unmappedFields(result: McpToolsListResult): string[] {
  const found = new Set<string>();
  if (present(result.nextCursor)) found.add("nextCursor");
  if (present(result._meta)) found.add("_meta");
  for (const t of result.tools ?? []) {
    if (present(t.name)) found.add("tools[].name");
    if (present(t.title)) found.add("tools[].title");
    if (present(t.description)) found.add("tools[].description");
    if (present(t.inputSchema)) found.add("tools[].inputSchema");
    if (present(t.outputSchema)) found.add("tools[].outputSchema");
    if (present(t._meta)) found.add("tools[]._meta");
    const a = t.annotations;
    if (!a) continue;
    if (present(a.title)) found.add("tools[].annotations.title");
    if (present(a.readOnlyHint)) found.add("tools[].annotations.readOnlyHint");
    if (present(a.destructiveHint)) found.add("tools[].annotations.destructiveHint");
    if (present(a.idempotentHint)) found.add("tools[].annotations.idempotentHint");
    if (present(a.openWorldHint)) found.add("tools[].annotations.openWorldHint");
  }
  // Mapped annotation fields still appear in unmapped_fields? Spec: "not represented in rows".
  // The annotation *values* are represented. The field names themselves are the source
  // of those rows, so they are represented. Drop mapped ones.
  const mapped = new Set([
    "tools[].annotations.readOnlyHint",
    "tools[].annotations.destructiveHint",
    "tools[].annotations.idempotentHint",
    "tools[].annotations.openWorldHint",
  ]);
  return [...found].filter((f) => !mapped.has(f)).sort();
}
