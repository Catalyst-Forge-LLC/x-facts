import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { canonicalBytes, contentDigest, stripEnvelope } from "./canonicalize.ts";
import { SPECS } from "./spec.ts";

const vec = (name: string) =>
  JSON.parse(
    readFileSync(resolve(SPECS, "profiles/mcp-tools-list/test-vectors", name), "utf8"),
  );

test("envelope strip keeps only result", () => {
  const src = vec("ollanet-like.source.json");
  const result = stripEnvelope(src);
  assert.ok(Array.isArray(result.tools));
  assert.equal(result.tools.length, 3);
});

test("digest is stable across key order and tool order", () => {
  const a = {
    tools: [
      { name: "b", description: "second", inputSchema: { type: "object", z: 1, a: 2 } },
      { name: "a", description: "first", inputSchema: { type: "object", a: 2, z: 1 } },
    ],
  };
  const b = {
    jsonrpc: "2.0",
    id: 99,
    result: {
      tools: [
        { inputSchema: { z: 1, a: 2, type: "object" }, description: "first", name: "a" },
        { inputSchema: { a: 2, type: "object", z: 1 }, name: "b", description: "second" },
      ],
    },
  };
  assert.equal(contentDigest(a), contentDigest(b));
  assert.equal(canonicalBytes(a), canonicalBytes(b));
});

test("digest changes when a tool is added", () => {
  const base = vec("forgetrail-like.source.json");
  const extra = {
    tools: [...base.tools, { name: "zzz", description: "new", inputSchema: { type: "object" } }],
  };
  assert.notEqual(contentDigest(base), contentDigest(extra));
});
