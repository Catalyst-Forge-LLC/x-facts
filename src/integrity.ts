import { contentDigest } from "./canonicalize.ts";
import type { Panel } from "./types.ts";

export function checkIntegrity(panel: Panel, source: unknown): { ok: boolean; expected: string; actual: string } {
  const expected = contentDigest(source);
  const actual = panel.provenance.content_digest;
  return { ok: expected === actual, expected, actual };
}
