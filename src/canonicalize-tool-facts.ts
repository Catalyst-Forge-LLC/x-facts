import { createHash } from "node:crypto";
import canonicalize from "canonicalize";
import { parseToolFacts, type ToolFactsDoc } from "./parse-tool-facts.ts";

export const TOOL_FACTS_DIGEST_CANON = "jcs-rfc8785+frontmatter-only+tools-sorted";

export function sortToolFacts(doc: ToolFactsDoc): ToolFactsDoc {
  const tools = [...(doc.tools ?? [])].sort((a, b) => {
    const an = String(a?.name ?? "");
    const bn = String(b?.name ?? "");
    return an < bn ? -1 : an > bn ? 1 : 0;
  });
  return { ...doc, tools };
}

export function toolFactsCanonicalBytes(source: unknown): string {
  const jcs = canonicalize(sortToolFacts(parseToolFacts(source)));
  if (!jcs) throw new Error("JCS canonicalize returned empty for tool-facts");
  return jcs;
}

export function toolFactsDigest(source: unknown): string {
  const bytes = Buffer.from(toolFactsCanonicalBytes(source), "utf8");
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}
