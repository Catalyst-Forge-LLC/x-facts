import { Ajv } from "ajv";
import addFormats from "ajv-formats";
import { enums, panelSchema, rowLabel, severityFor, TOOL_KEYS } from "./spec.ts";
import type { Panel } from "./types.ts";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const schemaOk = ajv.compile(panelSchema);

export interface ValidateIssue {
  path: string;
  message: string;
}

export function validatePanel(data: unknown): ValidateIssue[] {
  const issues: ValidateIssue[] = [];
  if (!schemaOk(data)) {
    for (const err of schemaOk.errors ?? []) {
      issues.push({
        path: err.instancePath || "(root)",
        message: err.message ?? "schema error",
      });
    }
    return issues;
  }
  const panel = data as Panel;
  if (panel.provenance.digest_canonicalization !== "jcs-rfc8785+envelope-stripped+tools-sorted" &&
      panel.provenance.profile === "mcp-tools-list") {
    issues.push({
      path: "/provenance/digest_canonicalization",
      message: "mcp-tools-list must use jcs-rfc8785+envelope-stripped+tools-sorted",
    });
  }
  if (!panel.provenance.content_digest) {
    issues.push({ path: "/provenance/content_digest", message: "missing digest" });
  }
  const seen = new Set<string>();
  for (const [i, row] of panel.rows.entries()) {
    if (!TOOL_KEYS.includes(row.key)) {
      issues.push({ path: `/rows/${i}/key`, message: `unknown key ${row.key}` });
    }
    if (seen.has(row.key)) {
      issues.push({ path: `/rows/${i}/key`, message: `duplicate key ${row.key}` });
    }
    seen.add(row.key);
    if (row.label !== rowLabel(row.key)) {
      issues.push({ path: `/rows/${i}/label`, message: `expected ${rowLabel(row.key)}` });
    }
    const members = enums.keys[row.key]?.members;
    if (row.value === "undisclosed") {
      if (row.type !== "undisclosed") {
        issues.push({ path: `/rows/${i}/type`, message: "undisclosed value must use type undisclosed" });
      }
    } else if (members && !members.some((m) => m === row.value || String(m) === String(row.value))) {
      issues.push({ path: `/rows/${i}/value`, message: `${String(row.value)} is not a member of ${row.key}` });
    }
    const expected = severityFor(row.key, row.value);
    if (row.severity !== expected) {
      issues.push({
        path: `/rows/${i}/severity`,
        message: `severity must be ${expected} for ${row.key}=${String(row.value)}`,
      });
    }
  }
  if (panel.subject_identity.identity_confidence === "resolved") {
    const id = panel.subject_identity;
    if (!id.package || !id.version || !(id.resolved_integrity || id.binary_digest)) {
      issues.push({
        path: "/subject_identity",
        message: "resolved requires package, version, and an integrity or binary digest",
      });
    }
  }
  return issues;
}
