#!/usr/bin/env tsx
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { badgeSvg } from "./badge.ts";
import { buildPanel } from "./build-panel.ts";
import { diffRows, isSeverityDrift } from "./drift.ts";
import { viewerUrl } from "./encode-viewer.ts";
import { checkIntegrity } from "./integrity.ts";
import { fetchHttp, fetchStdio } from "./mcp-fetch.ts";
import { EXIT, type FetchContext, type Panel } from "./types.ts";
import { validatePanel } from "./validate-panel.ts";

function usage(): never {
  console.error(`xFacts Panel

  pnpm panel --source tools.json [--name NAME] [--url CANONICAL] [--out panel.json]
  pnpm panel --stdio -- <command> [args…]
  pnpm panel --http URL
  pnpm validate panel.json
  pnpm integrity panel.json --source tools.json
  pnpm drift approved.json --source tools.json
  pnpm drift approved.json --stdio -- <command> [args…]
  pnpm encode panel.json
  pnpm badge panel.json [--out badge.svg]
`);
  process.exit(EXIT.usage);
}

function parseArgs(argv: string[]) {
  const cmd = argv[0];
  const rest = argv.slice(1);
  const out: {
    cmd: string;
    source?: string;
    panel?: string;
    approved?: string;
    http?: string;
    stdio?: string[];
    name?: string;
    publisher?: string;
    url?: string;
    package?: string;
    out?: string;
    ttl?: number;
  } = { cmd };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--") {
      out.stdio = rest.slice(i + 1);
      break;
    }
    if (a === "--source") out.source = rest[++i];
    else if (a === "--http") out.http = rest[++i];
    else if (a === "--stdio") continue;
    else if (a === "--name") out.name = rest[++i];
    else if (a === "--publisher") out.publisher = rest[++i];
    else if (a === "--url") out.url = rest[++i];
    else if (a === "--package") out.package = rest[++i];
    else if (a === "--out") out.out = rest[++i];
    else if (a === "--ttl") out.ttl = Number(rest[++i]);
    else if (!a.startsWith("-") && !out.panel && !out.approved) {
      if (cmd === "drift") out.approved = a;
      else out.panel = a;
    } else usage();
  }
  return out;
}

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(resolve(path), "utf8"));
}

function writeOut(path: string | undefined, text: string) {
  if (!path) {
    process.stdout.write(text);
    return;
  }
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), text, "utf8");
}

function overlayCtx(base: FetchContext, args: ReturnType<typeof parseArgs>): FetchContext {
  return {
    ...base,
    subjectName: args.name ?? base.subjectName,
    publisher: args.publisher ?? base.publisher,
    canonicalUrl: args.url ?? base.canonicalUrl,
    packageName: args.package ?? base.packageName,
    ttlSeconds: args.ttl ?? base.ttlSeconds,
  };
}

async function loadSource(args: ReturnType<typeof parseArgs>): Promise<{ source: unknown; ctx: FetchContext }> {
  if (args.source) {
    const source = loadJson(args.source);
    const ctx: FetchContext = {
      sourceUrl: args.url ?? `file://${resolve(args.source)}`,
      canonicalUrl: args.url ?? `file://${resolve(args.source)}`,
    };
    return { source, ctx: overlayCtx(ctx, args) };
  }
  if (args.http) {
    const fetched = await fetchHttp(args.http);
    return { source: fetched.source, ctx: overlayCtx(fetched.ctx, args) };
  }
  if (args.stdio?.length) {
    const [command, ...cmdArgs] = args.stdio;
    const fetched = await fetchStdio(command, cmdArgs);
    return { source: fetched.source, ctx: overlayCtx(fetched.ctx, args) };
  }
  usage();
}

function printIssues(issues: { path: string; message: string }[]) {
  for (const i of issues) console.error(`  ${i.path}: ${i.message}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.cmd) usage();

  if (args.cmd === "panel") {
    const { source, ctx } = await loadSource(args);
    const panel = buildPanel(source, ctx);
    const issues = validatePanel(panel);
    if (issues.length) {
      console.error("generated Panel failed validation:");
      printIssues(issues);
      process.exit(EXIT.schema);
    }
    writeOut(args.out, JSON.stringify(panel, null, 2) + "\n");
    return;
  }

  if (args.cmd === "validate") {
    if (!args.panel) usage();
    const issues = validatePanel(loadJson(args.panel));
    if (issues.length) {
      console.error(`invalid ${args.panel}`);
      printIssues(issues);
      process.exit(EXIT.schema);
    }
    console.log(`valid ${args.panel}`);
    return;
  }

  if (args.cmd === "integrity") {
    if (!args.panel || !args.source) usage();
    const panel = loadJson(args.panel) as Panel;
    const issues = validatePanel(panel);
    if (issues.length) {
      printIssues(issues);
      process.exit(EXIT.schema);
    }
    const result = checkIntegrity(panel, loadJson(args.source));
    if (!result.ok) {
      console.error(`integrity fail: panel ${result.actual} != source ${result.expected}`);
      process.exit(EXIT.integrity);
    }
    console.log("integrity ok");
    return;
  }

  if (args.cmd === "drift") {
    if (!args.approved) usage();
    const approved = loadJson(args.approved) as Panel;
    const issues = validatePanel(approved);
    if (issues.length) {
      printIssues(issues);
      process.exit(EXIT.schema);
    }
    const { source, ctx } = await loadSource(args);
    const fresh = buildPanel(source, {
      ...ctx,
      subjectName: args.name ?? approved.subject.name,
      publisher: args.publisher ?? approved.subject.publisher,
      canonicalUrl: args.url ?? approved.subject.canonical_url,
      packageName: args.package ?? approved.subject_identity.package,
    });
    const events = diffRows(approved, fresh);
    if (!events.length) {
      console.log("no row drift");
      return;
    }
    for (const e of events) {
      console.log(JSON.stringify(e));
    }
    process.exit(isSeverityDrift(events) ? EXIT.driftSeverity : EXIT.driftOther);
  }

  if (args.cmd === "encode") {
    if (!args.panel) usage();
    const panel = loadJson(args.panel) as Panel;
    const issues = validatePanel(panel);
    if (issues.length) {
      printIssues(issues);
      process.exit(EXIT.schema);
    }
    console.log(viewerUrl(panel));
    return;
  }

  if (args.cmd === "badge") {
    if (!args.panel) usage();
    const panel = loadJson(args.panel) as Panel;
    const issues = validatePanel(panel);
    if (issues.length) {
      printIssues(issues);
      process.exit(EXIT.schema);
    }
    writeOut(args.out, badgeSvg(panel));
    return;
  }

  usage();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(EXIT.usage);
});
