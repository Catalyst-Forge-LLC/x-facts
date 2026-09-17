import { contentDigest } from "./canonicalize.ts";
import { toolFactsDigest } from "./canonicalize-tool-facts.ts";
import { isToolFactsSource } from "./parse-tool-facts.ts";
import type { Panel } from "./types.ts";

export function sourceDigest(source: unknown, profile?: string): string {
  if (profile === "tool-facts" || isToolFactsSource(source)) {
    return toolFactsDigest(source);
  }
  return contentDigest(source);
}

export function checkIntegrity(panel: Panel, source: unknown): { ok: boolean; expected: string; actual: string } {
  const expected = sourceDigest(source, panel.provenance.profile);
  const actual = panel.provenance.content_digest;
  return { ok: expected === actual, expected, actual };
}
