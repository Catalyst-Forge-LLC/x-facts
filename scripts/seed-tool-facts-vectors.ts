import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildPanel } from "../src/build-panel.ts";
import { encodePanelHash } from "../src/encode-viewer.ts";
import { validatePanel } from "../src/validate-panel.ts";

const VEC = resolve("specs/profiles/tool-facts/test-vectors");
mkdirSync(VEC, { recursive: true });

const sources = [
  {
    id: "forgetrail-mcp",
    from: "../tool-facts/examples/forgetrail-mcp/TOOL_FACTS.md",
    ctx: {
      packageName: "npm:forgetrail-mcp",
      canonicalUrl: "https://forgetrail.dev",
    },
  },
  {
    id: "ollanet-mcp",
    from: "../tool-facts/examples/ollanet-mcp/TOOL_FACTS.md",
    ctx: {
      packageName: "npm:ollanet",
      canonicalUrl: "https://ollanet.dev",
    },
  },
  {
    id: "dictawhisper-mcp",
    from: "../tool-facts/examples/dictawhisper-mcp/TOOL_FACTS.md",
    ctx: {
      packageName: "npm:dictawhisper",
      canonicalUrl: "https://dictawhisper.com",
    },
  },
];

const fetchedAt = "2026-09-16T00:00:00.000Z";

for (const s of sources) {
  const srcPath = resolve(s.from);
  const destMd = resolve(VEC, `${s.id}.source.md`);
  copyFileSync(srcPath, destMd);
  const source = readFileSync(destMd, "utf8");
  const panel = buildPanel(source, {
    sourceUrl: `file://${destMd}`,
    fetchedAt,
    ttlSeconds: 3600,
    ...s.ctx,
  });
  const issues = validatePanel(panel);
  if (issues.length) {
    console.error(s.id, issues);
    process.exit(1);
  }
  const destPanel = resolve(VEC, `${s.id}.panel.json`);
  writeFileSync(destPanel, JSON.stringify(panel, null, 2) + "\n");
  console.log(
    s.id,
    panel.subject.version,
    panel.rows.find((r) => r.key === "side_effects_worst")?.value,
    panel.rows.find((r) => r.key === "filesystem")?.value,
    panel.rows.find((r) => r.key === "network")?.value,
  );
  if (s.id === "forgetrail-mcp") {
    copyFileSync(destPanel, resolve("site/examples/forgetrail-mcp.native.panel.json"));
    console.log("native hash", encodePanelHash(panel));
  }
}
