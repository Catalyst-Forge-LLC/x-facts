# Panel decision log

Short, dated entries. The point is traceability. Normative text lives in [`PANEL.md`](./PANEL.md).

| Date | Decision | Why |
|---|---|---|
| 2026-08-17 | Single master spec in x-facts (`PANEL.md`). No per-label Panel specs this cycle. | One implementable contract. Per-profile docs appear when a profile ships. |
| 2026-08-17 | Tool path first. `mcp-tools-list` is the demonstration. App / model / skill / agent enums deferred. | Depth over breadth. Derived tool-surface drift is the edge; other layers are presentation of facts already available elsewhere. |
| 2026-08-17 | Five live `{LABEL}_FACTS.md` formats stay published as transitional natives. Only `tool-facts` gets a Panel profile this cycle, marked native/stopgap. | Public sites remain useful. They are not the next product surface. |
| 2026-08-17 | Severity tables: global per row key, documented per-profile overrides. | Comparability across profiles; honesty when source semantics differ. Revisit at the second profile. |
| 2026-08-17 | `conflicts` block deferred until a second profile exists in a covered layer. | Useful later; must not stall `mcp-tools-list`. |
| 2026-08-17 | `app` layer vs CycloneDX/SPDX rendering profile: deferred. Does not gate agent-layer work. | No SBOM profile this cycle. |
| 2026-08-17 | Canonical digest: JCS RFC 8785 after stripping JSON-RPC envelope and sorting tools by name. | Raw-bytes digests are not reproducible. |
| 2026-08-17 | `subject_identity` required; `unknown` is a valid confidence. | Digest binds words, not the binary. |
| 2026-08-17 | Validator splits integrity (digest) from row-level drift, separate exit codes. | Operators need "gained a destructive tool," not "bytes changed." |
| 2026-08-17 | Consumer review (step 0) before freezing the schema. Record non-response. | A schema frozen before a harness author is heard gets rewritten. |
| 2026-08-17 | Specs/schemas CC0, tooling MIT, permanently open. Hosted service is hypothesis, not plan. | Say the license posture before there are adopters. |
