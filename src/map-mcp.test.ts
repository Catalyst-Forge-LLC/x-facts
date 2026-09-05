import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { buildPanel } from "./build-panel.ts";
import { stripEnvelope } from "./canonicalize.ts";
import { SPECS } from "./spec.ts";
import { validatePanel } from "./validate-panel.ts";
import type { FetchContext } from "./types.ts";

function source(name: string) {
  return JSON.parse(
    readFileSync(resolve(SPECS, "profiles/mcp-tools-list/test-vectors", name), "utf8"),
  );
}

function row(panel: ReturnType<typeof buildPanel>, key: string) {
  const found = panel.rows.find((r) => r.key === key);
  assert.ok(found, `missing row ${key}`);
  return found;
}

test("forgetrail-like: silent annotations stay undisclosed", () => {
  const ctx: FetchContext = {
    transport: "stdio",
    sourceUrl: "stdio://forgetrail-mcp",
    canonicalUrl: "https://forgetrail.dev",
    subjectName: "ForgeTrail MCP Server",
    publisher: "Catalyst Forge",
    fetchedAt: "2026-09-04T20:00:00.000Z",
  };
  const panel = buildPanel(source("forgetrail-like.source.json"), ctx);
  const issues = validatePanel(panel);
  assert.deepEqual(issues, []);
  assert.equal(row(panel, "kind").value, "mcp-server");
  assert.equal(row(panel, "runtime").value, "local-process");
  assert.equal(row(panel, "transport").value, "stdio");
  assert.equal(row(panel, "side_effects_worst").value, "undisclosed");
  assert.equal(row(panel, "filesystem").value, "undisclosed");
  assert.equal(row(panel, "network").value, "undisclosed");
  assert.equal(row(panel, "processes").value, "undisclosed");
  assert.equal(panel.provenance.verification, "derived");
  assert.equal(panel.subject_identity.identity_confidence, "unknown");
  assert.ok(panel.unmapped_fields.includes("tools[].description"));
  assert.ok(panel.unmapped_fields.includes("tools[].name"));
});

test("ollanet-like: JSON-RPC envelope does not change mapping", () => {
  const ctx: FetchContext = {
    transport: "stdio",
    sourceUrl: "stdio://ollanet mcp",
    subjectName: "ollanet MCP Server",
    fetchedAt: "2026-09-04T20:00:00.000Z",
  };
  const panel = buildPanel(source("ollanet-like.source.json"), ctx);
  assert.deepEqual(validatePanel(panel), []);
  assert.equal(row(panel, "side_effects_worst").value, "undisclosed");
  assert.equal(stripEnvelope(source("ollanet-like.source.json")).tools.length, 3);
});

test("annotated: conservative collapse uses stated hints only", () => {
  const ctx: FetchContext = {
    transport: "stdio",
    sourceUrl: "stdio://annotated-mcp",
    subjectName: "Annotated MCP",
    fetchedAt: "2026-09-04T20:00:00.000Z",
  };
  const panel = buildPanel(source("annotated.source.json"), ctx);
  assert.deepEqual(validatePanel(panel), []);
  assert.equal(row(panel, "side_effects_worst").value, "destructive");
  assert.equal(row(panel, "side_effects_worst").severity, "danger");
  assert.equal(row(panel, "network").value, "unrestricted");
  assert.equal(row(panel, "network").severity, "danger");
  assert.equal(row(panel, "idempotent").value, false);
  assert.equal(row(panel, "filesystem").value, "undisclosed");
});

test("three live shelf MCP sources each produce a valid Panel", () => {
  const files = [
    "forgetrail-live.source.json",
    "ollanet-live.source.json",
    "dictawhisper-live.source.json",
  ];
  const digests = new Set<string>();
  for (const file of files) {
    const panel = buildPanel(source(file), {
      transport: "stdio",
      sourceUrl: `file://${file}`,
      fetchedAt: "2026-09-04T23:00:00.000Z",
    });
    assert.deepEqual(validatePanel(panel), [], file);
    assert.equal(row(panel, "kind").value, "mcp-server");
    digests.add(panel.provenance.content_digest);
  }
  assert.equal(digests.size, 3);
});

test("three structurally different sources each produce a valid Panel", () => {
  const files = [
    "forgetrail-like.source.json",
    "ollanet-like.source.json",
    "annotated.source.json",
  ];
  const digests = new Set<string>();
  for (const file of files) {
    const panel = buildPanel(source(file), {
      sourceUrl: `file://${file}`,
      fetchedAt: "2026-09-04T20:00:00.000Z",
    });
    assert.deepEqual(validatePanel(panel), [], file);
    digests.add(panel.provenance.content_digest);
  }
  assert.equal(digests.size, 3);
});
