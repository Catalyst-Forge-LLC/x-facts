export type Layer = "tool";
export type Severity = "info" | "caution" | "danger";
export type RowType = "enum" | "scalar" | "list" | "undisclosed";
export type Verification = "self-asserted" | "derived" | "attested";
export type Signature = "none" | "present-unverified" | "verified" | "invalid";
export type IdentityConfidence = "resolved" | "partial" | "unknown";

export type RowValue = string | boolean | number | RowValue[];

export interface PanelRow {
  key: string;
  label: string;
  value: RowValue;
  type: RowType;
  severity: Severity;
}

export interface Panel {
  panel_version: "0.1.0";
  layer: Layer;
  subject: {
    name: string;
    publisher?: string;
    version?: string;
    canonical_url: string;
  };
  subject_identity: {
    package?: string;
    version?: string;
    resolved_integrity?: string;
    binary_digest?: string;
    identity_confidence: IdentityConfidence;
  };
  rows: PanelRow[];
  provenance: {
    profile: string;
    profile_version: string;
    source_format: string;
    source_version: string;
    source_url: string;
    fetched_at: string;
    content_digest: string;
    digest_canonicalization: string;
    verification: Verification;
    signature: Signature;
    signature_detail?: string;
    attribution?: string;
    non_endorsement?: string;
  };
  freshness: {
    etag?: string;
    ttl_seconds: number;
    stale: boolean;
  };
  unmapped_fields: string[];
}

export interface McpToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface McpTool {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
  annotations?: McpToolAnnotations;
  _meta?: unknown;
}

export interface McpToolsListResult {
  tools: McpTool[];
  nextCursor?: string;
  _meta?: unknown;
}

export type TransportKind = "stdio" | "sse" | "streamable-http";

export interface FetchContext {
  transport?: TransportKind;
  sourceUrl: string;
  subjectName?: string;
  publisher?: string;
  subjectVersion?: string;
  canonicalUrl?: string;
  packageName?: string;
  packageVersion?: string;
  resolvedIntegrity?: string;
  binaryDigest?: string;
  fetchedAt?: string;
  ttlSeconds?: number;
  etag?: string;
}

export const EXIT = {
  ok: 0,
  schema: 1,
  usage: 2,
  integrity: 3,
  driftSeverity: 4,
  driftOther: 5,
} as const;
