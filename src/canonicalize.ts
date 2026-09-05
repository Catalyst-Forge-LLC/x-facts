import { createHash } from "node:crypto";
import canonicalize from "canonicalize";
import type { McpToolsListResult } from "./types.ts";

export const DIGEST_CANON = "jcs-rfc8785+envelope-stripped+tools-sorted";

export function stripEnvelope(doc: unknown): McpToolsListResult {
  if (!doc || typeof doc !== "object") {
    throw new Error("tools/list source is not an object");
  }
  const rec = doc as Record<string, unknown>;
  if (rec.result && typeof rec.result === "object") {
    return rec.result as McpToolsListResult;
  }
  if (Array.isArray(rec.tools)) {
    return rec as unknown as McpToolsListResult;
  }
  throw new Error("tools/list source has neither result nor tools[]");
}

export function sortTools(result: McpToolsListResult): McpToolsListResult {
  const tools = [...(result.tools ?? [])].sort((a, b) => {
    const an = String(a?.name ?? "");
    const bn = String(b?.name ?? "");
    return an < bn ? -1 : an > bn ? 1 : 0;
  });
  const out: McpToolsListResult = { tools };
  if (result.nextCursor !== undefined) out.nextCursor = result.nextCursor;
  if (result._meta !== undefined) out._meta = result._meta;
  return out;
}

export function canonicalBytes(doc: unknown): string {
  const result = sortTools(stripEnvelope(doc));
  const jcs = canonicalize(result);
  if (!jcs) throw new Error("JCS canonicalize returned empty");
  return jcs;
}

export function contentDigest(doc: unknown): string {
  const bytes = Buffer.from(canonicalBytes(doc), "utf8");
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}
