import { resolve } from "node:path";
import { contentDigest, DIGEST_CANON, stripEnvelope } from "./canonicalize.ts";
import { mapMcpRows, unmappedFields } from "./map-mcp.ts";
import { readJson, SPECS } from "./spec.ts";
import type { FetchContext, IdentityConfidence, Panel } from "./types.ts";

const mapping = readJson<{
  profile: string;
  profile_version: string;
  source_format: string;
  source_version: string;
  attribution: string;
  non_endorsement: string;
}>(resolve(SPECS, "profiles/mcp-tools-list/mapping.json"));

export function identityConfidence(ctx: FetchContext): IdentityConfidence {
  const hasPkg = Boolean(ctx.packageName && (ctx.packageVersion || ctx.subjectVersion));
  const hasHash = Boolean(ctx.resolvedIntegrity || ctx.binaryDigest);
  if (hasPkg && hasHash) return "resolved";
  if (hasPkg || hasHash || ctx.subjectVersion || ctx.packageVersion) return "partial";
  return "unknown";
}

export function buildPanel(source: unknown, ctx: FetchContext): Panel {
  const result = stripEnvelope(source);
  const fetchedAt = ctx.fetchedAt ?? new Date().toISOString();
  const ttl = ctx.ttlSeconds ?? 3600;
  const name = ctx.subjectName ?? "MCP server";
  const canonical = ctx.canonicalUrl ?? ctx.sourceUrl;
  const version = ctx.subjectVersion ?? ctx.packageVersion;

  const subject: Panel["subject"] = { name, canonical_url: canonical };
  if (ctx.publisher) subject.publisher = ctx.publisher;
  if (version) subject.version = version;

  const identity: Panel["subject_identity"] = {
    identity_confidence: identityConfidence(ctx),
  };
  if (ctx.packageName) identity.package = ctx.packageName;
  if (ctx.packageVersion || ctx.subjectVersion) {
    identity.version = ctx.packageVersion ?? ctx.subjectVersion;
  }
  if (ctx.resolvedIntegrity) identity.resolved_integrity = ctx.resolvedIntegrity;
  if (ctx.binaryDigest) identity.binary_digest = ctx.binaryDigest;

  return {
    panel_version: "0.1.0",
    layer: "tool",
    subject,
    subject_identity: identity,
    rows: mapMcpRows(result, ctx),
    provenance: {
      profile: mapping.profile,
      profile_version: mapping.profile_version,
      source_format: mapping.source_format,
      source_version: mapping.source_version,
      source_url: ctx.sourceUrl,
      fetched_at: fetchedAt,
      content_digest: contentDigest(source),
      digest_canonicalization: DIGEST_CANON,
      verification: "derived",
      signature: "none",
      attribution: mapping.attribution,
      non_endorsement: mapping.non_endorsement,
    },
    freshness: {
      ...(ctx.etag ? { etag: ctx.etag } : {}),
      ttl_seconds: ttl,
      stale: false,
    },
    unmapped_fields: unmappedFields(result),
  };
}

export function isStale(panel: Panel, now = new Date()): boolean {
  const fetched = Date.parse(panel.provenance.fetched_at);
  if (Number.isNaN(fetched)) return true;
  return fetched + panel.freshness.ttl_seconds * 1000 < now.getTime();
}
