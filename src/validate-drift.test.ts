import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { buildPanel } from "./build-panel.ts";
import { SPECS } from "./spec.ts";
import { diffRows, isSeverityDrift } from "./drift.ts";
import { checkIntegrity } from "./integrity.ts";
import { validatePanel } from "./validate-panel.ts";
import type { Panel } from "./types.ts";

const silent = {
  tools: [{ name: "ping", description: "ok", inputSchema: { type: "object" } }],
};

const ctx = {
  transport: "stdio" as const,
  sourceUrl: "stdio://x",
  fetchedAt: "2026-09-04T20:00:00.000Z",
};

test("integrity fails when the source gained a tool", () => {
  const panel = buildPanel(silent, ctx);
  const extra = {
    tools: [...silent.tools, { name: "shell", description: "run", inputSchema: { type: "object" } }],
  };
  const result = checkIntegrity(panel, extra);
  assert.equal(result.ok, false);
});

test("integrity passes the matching source", () => {
  const panel = buildPanel(silent, ctx);
  assert.equal(checkIntegrity(panel, silent).ok, true);
});

test("drift reports a harsher side-effect as severity drift", () => {
  const approved = buildPanel(silent, ctx);
  const destructive = {
    tools: [
      {
        name: "ping",
        description: "ok",
        inputSchema: { type: "object" },
        annotations: { destructiveHint: true, readOnlyHint: false, idempotentHint: false },
      },
    ],
  };
  const fresh = buildPanel(destructive, ctx);
  const events = diffRows(approved, fresh);
  assert.ok(events.some((e) => e.key === "side_effects_worst"));
  assert.equal(isSeverityDrift(events), true);
});

test("invalid Panel: invented key is rejected", () => {
  const panel = buildPanel(silent, ctx) as Panel;
  panel.rows.push({
    key: "vibes",
    label: "Vibes",
    value: "high",
    type: "enum",
    severity: "info",
  } as Panel["rows"][number]);
  const issues = validatePanel(panel);
  assert.ok(issues.some((i) => i.message.includes("vibes") || i.path.includes("key")));
});

test("golden invalid fixture fails schema", () => {
  const broken = JSON.parse(
    readFileSync(resolve(SPECS, "fixtures/panels/invalid-missing-digest.json"), "utf8"),
  );
  const issues = validatePanel(broken);
  assert.ok(issues.length > 0);
});

test("invalid Panel: author-chosen severity is rejected", () => {
  const panel = buildPanel(silent, ctx);
  const se = panel.rows.find((r) => r.key === "side_effects_worst");
  assert.ok(se);
  se.severity = "info";
  se.value = "destructive";
  se.type = "enum";
  const issues = validatePanel(panel);
  assert.ok(issues.some((i) => i.path.includes("severity")));
});
