# xFacts Panel Specification

**Version:** 0.1.0  
**Status:** Normative suite spec for the next implementation cycle.  
**License:** CC0 (this spec, schemas, profiles). Tooling is MIT.  
**Supersedes:** [`PANEL_SPEC.md`](./PANEL_SPEC.md), [`PANEL_SPEC_ADDENDUM.md`](./PANEL_SPEC_ADDENDUM.md), [`PANEL_SPEC_ADDENDUM_II.md`](./PANEL_SPEC_ADDENDUM_II.md) (review drafts; keep as source history).

This file is the single master. Do not fork a parallel Panel spec in a label repo until a profile for that layer actually ships.

---

## 0. What this project is

Two purposes, held together:

1. **A free, permanently open tool** for seeing what an agent's tools can reach, and for detecting when that changes.
2. **A public demonstration of engineering judgment** by Catalyst Forge.

It is not a standards body, a product, or a company. Any future paid service is an untested hypothesis (§11) and MUST NOT shape the open design. When the two purposes appear to conflict, the open tool wins.

The valuable thing is **not** another publisher-filled form. Transparency artifacts that depend on authors filling out files have a long history of going unread. The valuable thing is **change detection over a derived tool surface**: knowing that an MCP server gained a shell-executing tool since it was approved, and being able to prove when.

The **Panel** is the data structure that makes that possible. It is instrumental, not the point.

### 0.1 Relation to the five live labels

The five `{LABEL}_FACTS.md` formats and `*.dev` sites remain live. They are **transitional natives**, not the next product surface.

| Existing format | Role under this spec |
|---|---|
| `TOOL_FACTS.md` | The one native profile still justified (`tool-facts`). Stopgap. Marked native in every renderer. Deprecated if MCP grows equivalent fields. |
| `APP_FACTS.md`, `MODEL_FACTS.md`, `AGENT_FACTS.md`, `SKILL_FACTS.md` | Legacy natives. Stay published. Do **not** get new enum vocabularies, generators, or Panel profiles in this cycle. |

Do not add layers, labels, or domains to make the family look complete. Depth over breadth, without exception.

### 0.2 The one-line test

Before building anything:

> Does this help someone see what their agents can reach, or see that it changed?

If no, it is surface area. Surface area is what this project already had to cut once.

---

## 1. Terminology

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are as in RFC 2119.

| Term | Meaning |
|---|---|
| **Source document** | The upstream artifact being labeled — a `tools/list` result, Agent Card, SBOM, SPDX file, or (stopgap) `TOOL_FACTS.md`. |
| **Profile** | A named, versioned mapping from one source format into a Panel. |
| **Panel** | The normalized JSON structure in §3. |
| **Subject** | The real-world thing described — typically an MCP server in this cycle. |
| **Native profile** | A profile whose source is an xFacts-defined format. Currently only `tool-facts`. |
| **Renderer** | Anything that displays a Panel to a human. |
| **Policy consumer** | Anything that makes an allow / deny / prompt decision from a Panel. |

xFacts is **not** a competing metadata standard. Where a format already exists and has adopters, a profile **reads** it and renders a Panel. The upstream document stays canonical. A Panel is a view of it and always links home.

Three properties:

1. **Derived, not asserted.** A Panel is produced by fetching and mapping a source. Hand-authoring is the exception.
2. **Honest about epistemic status.** Every Panel declares whether contents are self-asserted, mechanically derived, or third-party attested.
3. **Never the authority.** Publishers host truth. xFacts hosts views.

```
source document  ──[ profile ]──▶  Panel  ──▶  viewer / badge / validator / drift
(someone else's)   (mapping)       (ours)      (render, gate, CI)
```

---

## 2. Layers

Every Panel declares exactly one `layer`. This cycle implements **`tool` only**.

| Layer | Question | This cycle |
|---|---|---|
| `tool` | What does this touch when invoked? | **Build.** Schema enums, `mcp-tools-list`, then native `tool-facts`. |
| `agent` | What may this actor do, and on what leash? | Deferred. Enums designed only alongside a real Agent Card profile. |
| `model` | What went into this model? | Deferred until the tool path has an external user. |
| `app` | What is this built from? | Deferred. May later be a rendering profile over CycloneDX/SPDX rather than a first-class identity. |
| `skill` | What will this teach my agent to do? | Deferred. |

Adding a layer still requires the existing three-part test: someone must need to trust the thing at install time; the essential facts must be objective and at least partly machine-derivable; no incumbent format already answers the question well. Failing the third test is not fatal *if* the response is a profile rather than a new format.

Do **not** stub enums for layers with no profile in this cycle.

---

## 3. The Panel structure

A Panel is a JSON object. It MUST validate against `panel.schema.json` (JSON Schema draft-07) once that file exists.

```json
{
  "panel_version": "0.1.0",
  "layer": "tool",
  "subject": {
    "name": "ForgeKit MCP Server",
    "publisher": "Catalyst Forge",
    "version": "0.4.2",
    "canonical_url": "https://example.com/mcp"
  },
  "subject_identity": {
    "package": "npm:@example/mcp-filesystem",
    "version": "0.4.2",
    "resolved_integrity": "sha512-…",
    "binary_digest": "sha256:…",
    "identity_confidence": "resolved"
  },
  "rows": [
    { "key": "kind", "label": "Kind", "value": "mcp-server", "type": "enum", "severity": "info" },
    { "key": "side_effects_worst", "label": "Worst side effect", "value": "read", "type": "enum", "severity": "info" },
    { "key": "filesystem", "label": "Filesystem", "value": "scoped", "type": "enum", "severity": "caution" },
    { "key": "network", "label": "Network", "value": "undisclosed", "type": "undisclosed" }
  ],
  "provenance": {
    "profile": "mcp-tools-list",
    "profile_version": "0.1.0",
    "source_format": "mcp/tools-list",
    "source_version": "2025-03-26",
    "source_url": "stdio://forgekit-mcp",
    "fetched_at": "2026-08-17T18:02:11Z",
    "content_digest": "sha256:9f2b…",
    "digest_canonicalization": "jcs-rfc8785+envelope-stripped+tools-sorted",
    "verification": "derived",
    "signature": "none"
  },
  "freshness": {
    "etag": "\"a1b2c3\"",
    "ttl_seconds": 3600,
    "stale": false
  },
  "unmapped_fields": ["tools[].annotations.openWorldHint"]
}
```

### 3.1 `subject`

`canonical_url` is REQUIRED and MUST point at the source document or its human-readable home. A renderer MUST surface this link. A Panel that cannot be traced back to a source is not conformant.

### 3.2 `subject_identity`

The content digest binds a Panel to *what a server said*, not to *what the server is*. Two builds can emit identical `tools/list` output. The profile MUST also record whatever package identity is observable.

The block itself is REQUIRED. Fields that cannot be observed are omitted.

| Field | Rule |
|---|---|
| `identity_confidence` | One of `resolved`, `partial`, `unknown`. REQUIRED. |
| `resolved` | Requires a package coordinate with a version **and** an integrity hash or binary digest. |
| `unknown` | Valid and honest. Policy consumers SHOULD treat it as grounds for prompting even when all rows are `info`. |

### 3.3 `rows`

Rows are the visible label.

- `key` MUST come from the registry for the declared layer (§4). Unknown keys MUST NOT be emitted; they belong in `unmapped_fields`.
- `value` MUST be a closed-enum member for that key, a scalar the source stated verbatim, a list of such, or the literal string `undisclosed`.
- `type` is one of `enum`, `scalar`, `list`, `undisclosed`.
- A Panel MUST NOT contain subjective claims. If it cannot be checked against the source, it does not belong in a row.

### 3.4 `severity`

`severity` is one of `info`, `caution`, `danger`. It exists so a renderer can color a row and a policy consumer can threshold on it.

**Severity MUST be assigned by a fixed mapping table, never by the author of a label.** `shell: true` is `danger` because the table says so, for every subject, always.

**Decision (this cycle):** severity tables are **global per row key**, with documented per-profile overrides when source semantics differ. Global tables ship in `enums.json` / `severity.json`. Overrides live in the profile directory and MUST be diffable.

### 3.5 `provenance`

All fields REQUIRED except `signature_detail`.

**`verification`** — the single most important field:

| Value | Meaning |
|---|---|
| `self-asserted` | The source is a publisher's own claim. Nothing was checked. |
| `derived` | Values were computed from an observable artifact — a live `tools/list`, a lockfile, a package manifest. |
| `attested` | Values carry a third-party claim the profile verified — a signed VC, a JWS with a resolvable key, a signed SBOM attestation. |

Mixed Panels take the **weakest** value present. A Panel that is 90% derived and 10% self-asserted is `self-asserted`.

**`signature`** is one of `none`, `present-unverified`, `verified`, `invalid`. A profile MUST NOT report `verified` unless it resolved a key and checked the signature. `invalid` MUST be rendered prominently and MUST NOT be silently downgraded to `none`.

**`content_digest`** is SHA-256 of the **canonical** source bytes (§5.2). A Panel without a digest MUST be treated as unverifiable by policy consumers.

**`digest_canonicalization`** MUST name the procedure used (for `mcp-tools-list`: `jcs-rfc8785+envelope-stripped+tools-sorted`). Changing the procedure is a major version bump of the profile.

### 3.6 `freshness`

Profiles that fetch over HTTP MUST honor standard caching and SHOULD record `etag`. A Panel is `stale` when `fetched_at + ttl_seconds` is in the past. Renderers MUST visibly mark stale Panels. Policy consumers SHOULD refuse to gate on a stale Panel and SHOULD refetch.

A confidently wrong label is worse than no label. Staleness is the most likely way to produce one.

### 3.7 `unmapped_fields`

Every field present in the source and not represented in `rows` MUST be listed. This makes profile gaps visible as data rather than silence.

---

## 4. Row key registry (`tool` layer only)

Keys are closed and versioned with this spec. A profile MAY emit a subset. A profile MUST NOT invent keys.

`kind`, `runtime`, `transport`, `credentials`, `side_effects_worst`,
`filesystem`, `network`, `processes`, `egress_destinations`, `telemetry`,
`idempotent`, `license`

Enum vocabularies live in `enums.json` and are normative. Adding a key or enum member is a minor version bump. Removing or re-meaning one is a major bump.

**Do not author `agent`, `model`, `app`, or `skill` enums in this cycle.** Those vocabularies are designed from real source documents when those profiles ship.

---

## 5. Profiles

A profile is a document plus a mapping implementation. Each profile MUST specify:

1. **Identifier and version** — e.g. `mcp-tools-list@0.1.0`.
2. **Source format and version range.**
3. **Discovery** — how to locate the source from a user-supplied input (well-known path, registry, repo convention, live endpoint).
4. **Field mapping** — source field → row key → enum member. Exhaustive and one-directional.
5. **Severity table** — global keys plus any documented overrides.
6. **Verification determination** — how it decides `self-asserted` vs `derived` vs `attested`, and what signature checking it performs.
7. **Conservative-collapse rule** — when several source values map to one row, emit the harsher value. `read` plus `write` is `write`. Ambiguity resolves toward caution, never reassurance.
8. **Canonicalization procedure** for the digest.
9. **Attribution string** and non-endorsement notice (§8).
10. **At least three test vectors** (source → expected Panel, byte-identical modulo `fetched_at`).

Profiles MUST NOT infer. If the source does not state whether a tool touches the filesystem, the row is `undisclosed` — not `none`. Inference is the failure mode that turns a label into a liability.

A profile that emits `undisclosed` on half its rows and is right about all of them is a success. A profile that guesses well is a failure that has not surfaced yet.

Profiles that cannot produce a reproducible `content_digest` are non-conformant and MUST NOT ship.

### 5.1 `mcp-tools-list` (ship first)

| | |
|---|---|
| **Source** | Live MCP `tools/list` + annotations |
| **Layer** | `tool` |
| **Verification ceiling** | `derived` |
| **Why first** | Observes a running server. No publisher cooperation. The only profile that can demonstrate the thesis on day one. |

Minimum behavior:

- Accept a live MCP server (stdio or HTTP).
- Call `tools/list` and read any annotations present.
- Map to `tool` row keys only.
- Emit `verification: "derived"`, a canonical `content_digest`, a `subject_identity` block, complete `unmapped_fields`, conservative collapse.
- Never invent values. Missing information → `undisclosed`.

#### Canonicalization (required before any digest)

A raw-bytes digest over a `tools/list` response is not reproducible (JSON-RPC `id`, key order, tool array order).

1. Strip the transport envelope. Discard `jsonrpc`, `id`, and framing. Retain only `result`.
2. Sort the tool array lexicographically by `name` (UTF-8 code point order).
3. Canonicalize per JCS (RFC 8785).
4. Digest the UTF-8 bytes of that form with SHA-256.

Record `digest_canonicalization: "jcs-rfc8785+envelope-stripped+tools-sorted"` in `provenance`.

Schema and this profile are **one loop**, not a sequence. Row keys are hypotheses about real `tools/list` documents. Exit criterion:

> Three structurally different real MCP servers each produce a valid Panel, and no new enum member or row key has been required for the most recent two.

Until that holds, both artifacts stay editable. After it holds, freeze the schema for the cycle.

### 5.2 Native `tool-facts` (after viewer + validator)

Maps `TOOL_FACTS.md` → `tool` Panel. Verification ceiling: `self-asserted`.

- Treat as a stopgap only.
- Every renderer and badge MUST visually mark it **native / xFacts-defined**.
- Do not invest in rich authoring UX.
- If MCP later gains equivalent structured fields, deprecate this profile rather than defend it.
- Keep the mapping conservative and the surface small.

### 5.3 Later profiles (not this cycle)

| Profile | Source | Layer | Ceiling | Gate |
|---|---|---|---|---|
| `a2a-agent-card` | `/.well-known/agent-card.json` (also legacy `agent.json`) | `agent` | `attested` | Contact A2A maintainers first. Design agent enums from real cards. |
| `nanda-agentfacts` | NANDA registry record | `agent` | `attested` | Contact NANDA first. Name collision: unofficial status above the fold on any matching domain. |
| `hf-model-card` | Hugging Face model card YAML | `model` | `self-asserted` | After tool path has an external user. |
| `cyclonedx-sbom` / `spdx-sbom` | CycloneDX JSON; SPDX 2.3+ / 3.0 AI | `app` / `model` | `derived` | Decide whether `app` stays a layer or becomes a rendering profile. Does not gate agent profiles. |

**Conflicts** (two profiles disagree about one subject — e.g. an Agent Card claiming no network while its MCP toolset observably calls out) are the most useful thing this project could eventually produce. A `conflicts` block is deferred until a **second** profile exists in a layer already covered. It does not gate `mcp-tools-list`.

---

## 6. Conformance

### 6.1 Conformant profile

- Emits Panels that validate against `panel.schema.json`.
- Emits only registered row keys and enum members for the declared layer.
- Emits `unmapped_fields` completely.
- Never infers absent facts; emits `undisclosed`.
- Applies conservative collapse.
- Passes published test vectors (byte-identical modulo `fetched_at` after canonicalization).

### 6.2 Conformant renderer

- Displays `subject.canonical_url` as a link.
- Displays `provenance.verification` with **equal prominence** to the rows. A `self-asserted` Panel that looks identical to an `attested` one is a non-conformant rendering.
- Displays `subject_identity.identity_confidence` when it is not `resolved`.
- Marks stale Panels visibly.
- Marks native profiles distinctly from adapted ones.
- Does not reorder or omit `danger` rows or an `invalid` signature.

### 6.3 Conformant policy consumer

- Refuses to gate on a Panel with no `content_digest`.
- Treats `undisclosed` as at least as restrictive as the harshest enum member for that key. `undisclosed` is not `none`.
- Refetches rather than acting on a stale Panel.
- SHOULD treat `identity_confidence: "unknown"` as grounds for prompting.

Do **not** ship a policy-engine adapter until a real harness author has reviewed the Panel shape (§7, step 0).

---

## 7. Implementation order (strict)

Do not start a later item until the previous milestone is functional and has test vectors.

| Step | Work | Notes |
|---|---|---|
| **0** | **Consumer review** | Show the Panel shape to at least one MCP host or agent harness author. Record the reply — including "no reply" — under `reviews/`. An unasked question is not a valid skip. This is the only input that can invalidate steps 1–4. |
| **1** | **`panel.schema.json` + `enums.json` (`tool` only) + `mcp-tools-list`** | One loop. Golden valid/invalid Panel fixtures. |
| **2** | **Validator / CI** | Two checks, separate exit codes (§7.1). |
| **3** | **Minimal `/v` viewer** | URL or self-contained fragment. Prominence rules in §6.2. No login, no server state. |
| **4** | **Badge (SVG)** | Harshest severity **and** `verification`. A badge that shows only "labeled" launders self-assertion. |
| **5** | **Native `tool-facts` profile** | Marked native/stopgap. |
| **6+** | Other profiles | Only after the above. Contact upstream first. |

`mcp-tools-list` is the demonstration that the thesis works. Everything else is secondary until it exists.

### 7.1 Validator: two checks, not one

**Check A — integrity** (cached or forwarded Panels). Given a Panel and its source, recompute the canonical digest. Mismatch means the Panel does not describe the document it claims to describe.

**Check B — drift** (live endpoints). Re-run the profile, produce a fresh Panel, **diff the rows**. Report at row granularity: rows added or removed; any row whose `severity` increased; any row that moved to a harsher enum member; any change to `subject_identity`.

Row-level drift is the actionable signal. "This server gained a `destructive` tool since you approved it" is what an operator needs. "The digest changed" is not — on a live endpoint it fires on a version-string bump as readily as on a new shell tool.

Exit codes MUST distinguish: integrity failure, severity-increasing drift, and non-severity drift. Exit non-zero on any §6.1 / §6.3 violation.

### 7.2 Suggested layout (informative)

```
specs/
  PANEL.md                 # this file
  panel.schema.json        # added in step 1
  enums.json               # tool layer only, step 1
  profiles/
    mcp-tools-list/
      profile.md
      mapping.json
      severity.json
      canonicalization.md
      test-vectors/
tools/
  validate/                # check A
  drift/                   # check B
  fetch-and-panel/
site/v/                    # or tools/viewer — Panel renderer
reviews/                   # consumer and upstream replies
```

Exact paths may move. The artifacts matter more than directory names. First implementation lives in **this repo** (x-facts), not in tool-facts, until a native `tool-facts` profile needs a mapping next to `TOOL_FACTS.md`.

---

## 8. Upstream relations

This is a specification requirement, not etiquette. Reputation is an actual output of this project.

- A profile for a third-party format MUST carry a non-endorsement notice and MUST link to the upstream project's canonical home.
- A profile MUST NOT present itself as an official implementation, registry, or successor of the format it reads.
- A profile for an actively maintained format SHOULD NOT ship before its maintainers have been contacted. Record the exchange. Their objections take precedence; a profile they reject MUST be withdrawn — do not negotiate, wait, or ship pending resolution.
- Domain names used for viewers MUST NOT imply ownership of an upstream project's name. Where a domain matches an existing project's term, unofficial status MUST appear above the fold.
- Panels MUST NOT be republished as a format of record.

A dispute with A2A or NANDA maintainers would cost more than every technical error in this repository combined. Treat that asymmetry as a design constraint.

Never describe this project's output as a standard for something someone else standardized.

---

## 9. Distribution surfaces

These consume Panels; they are not part of the Panel definition.

| Surface | Role |
|---|---|
| **Viewer (`/v`)** | Renders a Panel from a URL or encoded fragment. Portable, no server state. Existing hash viewers for `{LABEL}_FACTS.md` stay as share cards for legacy natives; they are not the Panel viewer. |
| **Badge** | SVG of harshest severity + `verification`. |
| **Validator / CI** | Integrity + drift (§7.1). SHOULD be the first tool after the first profile. |
| **Policy adapter** | Maps a Panel to an approval decision. Shape determined by a real harness author **before** it is designed. |

Existing discovery rules in [`DISCOVERY-AND-PUBLICATION.md`](./DISCOVERY-AND-PUBLICATION.md) still apply to legacy `{LABEL}_FACTS.md` files. A Panel's `subject.canonical_url` is the pointer for the new path.

---

## 10. Success criteria

### 10.1 "0.1 usable" (technical — all must hold)

- `mcp-tools-list` pointed at a running MCP server produces a valid, derived Panel with a reproducible digest and a `subject_identity` block.
- Two consecutive runs against an unchanged server produce identical digests.
- The validator distinguishes integrity failure from row-level drift, with separate exit codes.
- The viewer renders verification, identity confidence, and danger rows with correct prominence.
- Native vs adapted profiles are visually distinct.
- Test vectors exist and are checked in CI.

### 10.2 External (both must hold — not optional)

- At least one MCP host or agent harness author has reviewed the Panel shape; the response is recorded in the repository.
- At least one MCP server maintainer has been shown the Panel generated from their own server and has not objected to its accuracy.

Internal criteria can be satisfied without anyone outside the project seeing the work. That is a poor test of whether the work is right.

### 10.3 Project success (different question)

The project has succeeded if **any** of the following is true:

- A team uses the drift check and it catches a real change they would otherwise have missed.
- The MCP specification, or a major host, adopts equivalent capability — with or without credit.
- A reader of the repository concludes that the people behind it think carefully, and that conclusion leads somewhere.

The project has **not** failed merely because adoption is in the single digits, nobody uses the name, or an upstream absorbs the idea. Adoption metrics MUST NOT drive the roadmap.

Absorption is a good ending. If MCP grows structured egress and credential fields, or a host ships built-in tool-surface monitoring, the problem was real and this arrived early. Link to the better implementation. Do not architect profiles to make replacement difficult.

The failure mode to guard against: a repository of well-written specifications with no working profile, no external reader, and no recorded upstream contact. That is reached by continuing to write documents instead of shipping `mcp-tools-list`.

---

## 11. Hosted service: hypothesis, not plan

A continuous, multi-subject, historical drift check is a plausible paid service. It is **not being built**.

If it is ever built, the useful shape is an **audit record** (what each agent could reach on a given date, with digests and identity confidence, gaps marked as gaps) rather than an alerting product. Retention is the only part that is not reproducible after the fact.

Validation question, asked only in ordinary consulting work:

> Has anyone asked you what your agents can access — a customer questionnaire, an auditor, an incident review? What did you send them?

Consistent "yes, and we scrambled" is signal. Consistent "no one's asked" means keep it free. Do not build billing, design tiers, or hold anything back from the open project.

**License posture, public now:** specification, schemas, profiles, validator, drift check, viewer, and badge are permanently open — CC0 for specs and schemas, MIT for tooling. Any hosted service would be additive.

---

## 12. What to publish alongside the code

For a credibility asset, the reasoning is the artifact.

- **This spec** — the reframe: five original formats → Panel + profiles, because derived change detection is the edge.
- **The refusals** — DataFacts, PromptFacts, plus every subsequent decision not to build (including deferring app/model/skill this cycle).
- **A decision log** — dated, short entries for severity assignments, collapse rules, canonicalization, layer deferrals. Start at [`PANEL-DECISIONS.md`](./PANEL-DECISIONS.md).
- **Recorded consumer and upstream responses**, including non-responses, under `reviews/`.

Write these for a reader who is evaluating how you would handle their infrastructure.

---

## 13. Non-goals (this cycle)

- General authoring UI for hand-written labels.
- New native formats beyond the existing `tool-facts` stopgap.
- Endorsement or official status for any upstream format.
- Policy-engine adapter before a harness author reviews the Panel shape.
- Skill, full Model, or App layer work until the tool path is proven with an external user.
- Enum vocabularies for layers with no profile in this cycle.
- Features that only make sense for a hosted service that does not exist.
- Optimizing for adoption metrics.
- Defending suite branding at the expense of the capability.

---

## 14. Decisions already made

| Topic | Decision | Revisit when |
|---|---|---|
| Spec home | Single master in x-facts (`PANEL.md`) | A second layer actually ships |
| Severity tables | Global per row key, documented per-profile overrides | Second profile |
| `conflicts` block | Deferred | Second profile in a covered layer |
| `app` as a layer vs SBOM rendering profile | Deferred | `cyclonedx-sbom` / `spdx-sbom` |
| Existing five formats | Transitional natives; only `tool-facts` gets a Panel profile this cycle | Tool path has an external user |
| Signable Panels (renderer attestation chain) | Out of scope | After 0.1 usable |

---

## 15. Changelog

| Version | Notes |
|---|---|
| **0.1.0** | Master spec. Merges the 0.1.0-draft Panel shape, implementation addendum (schema/`mcp-tools-list` loop, canonicalization, `subject_identity`, two-check validator, consumer-first), and positioning addendum (drift as the product, depth over breadth, external success criteria, license posture). |

---

## License

CC0 — public domain. No attribution required.
