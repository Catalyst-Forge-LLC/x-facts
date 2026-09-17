import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { buildPanel } from "./build-panel.ts";
import { toolFactsDigest } from "./canonicalize-tool-facts.ts";
import { checkIntegrity } from "./integrity.ts";
import { parseToolFacts } from "./parse-tool-facts.ts";
import { SPECS } from "./spec.ts";
import { validatePanel } from "./validate-panel.ts";

function md(name: string) {
  return readFileSync(resolve(SPECS, "profiles/tool-facts/test-vectors", name), "utf8");
}

function row(panel: ReturnType<typeof buildPanel>, key: string) {
  const found = panel.rows.find((r) => r.key === key);
  assert.ok(found, `missing row ${key}`);
  return found;
}

const ctx = {
  sourceUrl: "file://TOOL_FACTS.md",
  fetchedAt: "2026-09-16T00:00:00.000Z",
};

test("forgetrail TOOL_FACTS maps reviewed reach, not undisclosed silence", () => {
  const panel = buildPanel(md("forgetrail-mcp.source.md"), {
    ...ctx,
    packageName: "npm:forgetrail-mcp",
  });
  assert.deepEqual(validatePanel(panel), []);
  assert.equal(panel.provenance.profile, "tool-facts");
  assert.equal(panel.provenance.verification, "self-asserted");
  assert.equal(row(panel, "side_effects_worst").value, "read");
  assert.equal(row(panel, "filesystem").value, "scoped");
  assert.equal(row(panel, "network").value, "none");
  assert.equal(row(panel, "credentials").value, "none");
  assert.equal(row(panel, "license").value, "Apache-2.0");
  assert.equal(row(panel, "idempotent").value, true);
  assert.equal(panel.subject.version, "0.3.10");
});

test("ollanet TOOL_FACTS collapses to destructive and unrestricted", () => {
  const panel = buildPanel(md("ollanet-mcp.source.md"), ctx);
  assert.deepEqual(validatePanel(panel), []);
  assert.equal(row(panel, "side_effects_worst").value, "destructive");
  assert.equal(row(panel, "network").value, "unrestricted");
  assert.equal(row(panel, "filesystem").value, "scoped");
  assert.equal(row(panel, "idempotent").value, false);
});

test("dictawhisper TOOL_FACTS is read, scoped, idempotent", () => {
  const panel = buildPanel(md("dictawhisper-mcp.source.md"), ctx);
  assert.deepEqual(validatePanel(panel), []);
  assert.equal(row(panel, "side_effects_worst").value, "read");
  assert.equal(row(panel, "filesystem").value, "scoped");
  assert.equal(row(panel, "network").value, "none");
  assert.equal(row(panel, "idempotent").value, true);
});

test("tool-facts digest is stable across tool order", () => {
  const doc = parseToolFacts(md("forgetrail-mcp.source.md"));
  const reversed = { ...doc, tools: [...(doc.tools ?? [])].reverse() };
  assert.equal(toolFactsDigest(doc), toolFactsDigest(reversed));
});

test("tool-facts integrity matches the source markdown", () => {
  const source = md("forgetrail-mcp.source.md");
  const panel = buildPanel(source, ctx);
  assert.equal(checkIntegrity(panel, source).ok, true);
});
