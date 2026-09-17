import { resolve } from "node:path";
import { contentDigest, DIGEST_CANON } from "./canonicalize.ts";
import { TOOL_FACTS_DIGEST_CANON, toolFactsDigest } from "./canonicalize-tool-facts.ts";
import { mapMcpRows, unmappedFields } from "./map-mcp.ts";
import { mapToolFactsRows, unmappedToolFactsFields } from "./map-tool-facts.ts";
import { isToolFactsSource, parseToolFacts } from "./parse-tool-facts.ts";
import { stripEnvelope } from "./canonicalize.ts";
import { readJson, SPECS } from "./spec.ts";
import type { FetchContext, IdentityConfidence, Panel } from "./types.ts";

const mcpMapping = readJson<{
  profile: string;
  profile_version: string;
  source_format: string;
  source_version: string;
  attribution: string;
  non_endorsement: string;
}>(resolve(SPECS, "profiles/mcp-tools-list/mapping.json"));

const toolFactsMapping = readJson<{
  profile: string;
  profile_version: string;
  source_format: string;
  source_version: string;
  attribution: string;
  non_endorsement: string;
}>(resolve(SPECS, "profiles/tool-facts/mapping.json"));

export function identityConfidence(ctx: FetchContext): IdentityConfidence {
  const hasPkg = Boolean(ctx.packageName && (ctx.packageVersion || ctx.subjectVersion));
  const hasHash = Boolean(ctx.resolvedIntegrity || ctx.binaryDigest);
  if (hasPkg && hasHash) return "resolved";
  if (hasPkg || hasHash || ctx.subjectVersion || ctx.packageVersion) return "partial";
  return "unknown";
}

function subjectAndIdentity(ctx: FetchContext, fallbackName: string, fallbackVersion?: string) {
  const fetchedAt = ctx.fetchedAt ?? new Date().toISOString();
  const ttl = ctx.ttlSeconds ?? 3600;
  const name = ctx.subjectName ?? fallbackName;
  const canonical = ctx.canonicalUrl ?? ctx.sourceUrl;
  const version = ctx.subjectVersion ?? ctx.packageVersion ?? fallbackVersion;

  const subject: Panel["subject"] = { name, canonical_url: canonical };
  if (ctx.publisher) subject.publisher = ctx.publisher;
  if (version) subject.version = version;

  const identity: Panel["subject_identity"] = {
    identity_confidence: identityConfidence({
      ...ctx,
      subjectVersion: ctx.subjectVersion ?? fallbackVersion,
    }),
  };
  if (ctx.packageName) identity.package = ctx.packageName;
  if (ctx.packageVersion || ctx.subjectVersion || fallbackVersion) {
    identity.version = ctx.packageVersion ?? ctx.subjectVersion ?? fallbackVersion;
  }
  if (ctx.resolvedIntegrity) identity.resolved_integrity = ctx.resolvedIntegrity;
  if (ctx.binaryDigest) identity.binary_digest = ctx.binaryDigest;

  return { subject, identity, fetchedAt, ttl };
}

export function buildMcpPanel(source: unknown, ctx: FetchContext): Panel {
  const result = stripEnvelope(source);
  const { subject, identity, fetchedAt, ttl } = subjectAndIdentity(ctx, "MCP server");

  return {
    panel_version: "0.1.0",
    layer: "tool",
    subject,
    subject_identity: identity,
    rows: mapMcpRows(result, ctx),
    provenance: {
      profile: mcpMapping.profile,
      profile_version: mcpMapping.profile_version,
      source_format: mcpMapping.source_format,
      source_version: mcpMapping.source_version,
      source_url: ctx.sourceUrl,
      fetched_at: fetchedAt,
      content_digest: contentDigest(source),
      digest_canonicalization: DIGEST_CANON,
      verification: "derived",
      signature: "none",
      attribution: mcpMapping.attribution,
      non_endorsement: mcpMapping.non_endorsement,
    },
    freshness: {
      ...(ctx.etag ? { etag: ctx.etag } : {}),
      ttl_seconds: ttl,
      stale: false,
    },
    unmapped_fields: unmappedFields(result),
  };
}

export function buildToolFactsPanel(source: unknown, ctx: FetchContext): Panel {
  const doc = parseToolFacts(source);
  const { subject, identity, fetchedAt, ttl } = subjectAndIdentity(
    {
      ...ctx,
      subjectName: ctx.subjectName ?? doc.name,
      publisher: ctx.publisher ?? doc.developer,
      canonicalUrl: ctx.canonicalUrl ?? doc.homepage ?? ctx.sourceUrl,
    },
    doc.name ?? "TOOL_FACTS.md",
    typeof doc.version === "string" ? doc.version : undefined,
  );

  return {
    panel_version: "0.1.0",
    layer: "tool",
    subject,
    subject_identity: identity,
    rows: mapToolFactsRows(doc),
    provenance: {
      profile: toolFactsMapping.profile,
      profile_version: toolFactsMapping.profile_version,
      source_format: toolFactsMapping.source_format,
      source_version: toolFactsMapping.source_version,
      source_url: ctx.sourceUrl,
      fetched_at: fetchedAt,
      content_digest: toolFactsDigest(source),
      digest_canonicalization: TOOL_FACTS_DIGEST_CANON,
      verification: "self-asserted",
      signature: "none",
      attribution: toolFactsMapping.attribution,
      non_endorsement: toolFactsMapping.non_endorsement,
    },
    freshness: {
      ...(ctx.etag ? { etag: ctx.etag } : {}),
      ttl_seconds: ttl,
      stale: false,
    },
    unmapped_fields: unmappedToolFactsFields(doc),
  };
}

export function buildPanel(source: unknown, ctx: FetchContext): Panel {
  if (isToolFactsSource(source)) return buildToolFactsPanel(source, ctx);
  return buildMcpPanel(source, ctx);
}

export function isStale(panel: Panel, now = new Date()): boolean {
  const fetched = Date.parse(panel.provenance.fetched_at);
  if (Number.isNaN(fetched)) return true;
  return fetched + panel.freshness.ttl_seconds * 1000 < now.getTime();
}
