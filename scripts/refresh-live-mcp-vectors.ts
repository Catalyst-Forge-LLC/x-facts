import { copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildPanel } from "../src/build-panel.ts";
import { encodePanelHash } from "../src/encode-viewer.ts";
import { fetchStdio } from "../src/mcp-fetch.ts";
import { validatePanel } from "../src/validate-panel.ts";
import type { FetchContext } from "../src/types.ts";

const VEC = resolve("specs/profiles/mcp-tools-list/test-vectors");
const fetchedAt = new Date().toISOString();

type Target = {
  id: string;
  command: string;
  args: string[];
  ctx: Partial<FetchContext>;
};

const targets: Target[] = [
  {
    id: "forgetrail-live",
    command: "node",
    args: ["Z:/workspace/forgetrail/mcp-server/dist/index.js"],
    ctx: {
      subjectName: "ForgeTrail MCP Server",
      publisher: "Catalyst Forge",
      canonicalUrl: "https://forgetrail.dev",
      packageName: "npm:forgetrail-mcp",
    },
  },
  {
    id: "ollanet-live",
    command: "node",
    args: ["Z:/workspace/ollanet/dist/cli.js", "mcp"],
    ctx: {
      subjectName: "ollanet MCP Server",
      publisher: "Catalyst Forge",
      canonicalUrl: "https://ollanet.dev",
      packageName: "npm:ollanet",
    },
  },
  {
    id: "dictawhisper-live",
    command: "node",
    args: ["--experimental-strip-types", "Z:/workspace/dictawhisper/src/mcp.ts"],
    ctx: {
      subjectName: "DictaWhisper MCP Server",
      publisher: "Catalyst Forge",
      canonicalUrl: "https://dictawhisper.com",
      packageName: "npm:dictawhisper",
    },
  },
];

function row(panel: ReturnType<typeof buildPanel>, key: string) {
  return panel.rows.find((r) => r.key === key)?.value;
}

for (const t of targets) {
  const fetched = await fetchStdio(t.command, t.args);
  const sourcePath = resolve(VEC, `${t.id}.source.json`);
  writeFileSync(sourcePath, JSON.stringify(fetched.source, null, 2) + "\n");

  const ctx: FetchContext = {
    ...fetched.ctx,
    ...t.ctx,
    fetchedAt,
    ttlSeconds: 3600,
  };
  const panel = buildPanel(fetched.source, ctx);
  const issues = validatePanel(panel);
  if (issues.length) {
    console.error(t.id, issues);
    process.exit(1);
  }
  const panelPath = resolve(VEC, `${t.id}.panel.json`);
  writeFileSync(panelPath, JSON.stringify(panel, null, 2) + "\n");

  console.log(
    t.id,
    "tools",
    fetched.source.tools?.length,
    "version",
    panel.subject.version,
    "side_effects",
    row(panel, "side_effects_worst"),
    "network",
    row(panel, "network"),
    "idempotent",
    row(panel, "idempotent"),
  );

  if (t.id === "forgetrail-live") {
    copyFileSync(panelPath, resolve("site/examples/forgetrail-mcp.panel.json"));
    console.log("hash", encodePanelHash(panel));
  }
}
