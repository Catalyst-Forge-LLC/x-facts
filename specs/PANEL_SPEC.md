# xFacts Panel Specification

> **Superseded.** Implement against [`PANEL.md`](./PANEL.md). This file is the
> review draft that started the reframe; keep it for history.

**Version:** 0.1.0-draft
**Status:** Superseded by `PANEL.md`.
**License:** CC0 (spec and schema). Reference tooling is MIT.

---

## 0. What this is

xFacts publishes **one glanceable label shape** and a set of **profiles** that
project existing, already-published metadata into it.

It is not a competing metadata standard. Where a format already exists and has
adopters — A2A Agent Cards, NANDA AgentFacts, MCP `tools/list`, Hugging Face
model card metadata, CycloneDX and SPDX SBOMs — xFacts reads that format and
renders it. Where no format exists, xFacts may define a **native** label, and
must say so plainly.

The unit of output is a **Panel**: a small, closed, machine-readable structure
that a human can read in under a minute and a program can act on.

```
source document  ──[ profile ]──▶  Panel  ──▶  viewer / badge / policy engine
(someone else's)   (mapping)       (ours)      (rendering, gating, CI)
```

Three properties define the project:

1. **Derived, not asserted.** A Panel is produced by fetching and mapping a
   source document. Hand-authoring is the exception, not the default.
2. **Honest about its own epistemic status.** Every Panel declares whether its
   contents are self-asserted, mechanically derived, or third-party attested.
3. **Never the authority.** The upstream document is canonical. A Panel is a
   view of it and always links home.

---

## 1. Terminology

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted
as described in RFC 2119.

| Term | Meaning |
|---|---|
| **Source document** | The upstream artifact being labeled — an Agent Card, an SBOM, a `tools/list` response, an SPDX file. |
| **Profile** | A named, versioned mapping from one source format into a Panel. |
| **Panel** | The normalized output structure defined in §3. |
| **Subject** | The real-world thing described — an app, model, tool server, agent configuration, or skill. |
| **Native profile** | A profile whose source document is an xFacts-defined format (currently only `tool-facts`). |
| **Renderer** | Any consumer that displays a Panel to a human. |
| **Policy consumer** | Any program that makes an allow/deny/prompt decision from a Panel. |

---

## 2. Layers

Every Panel declares exactly one `layer`. The layer determines which row keys
are meaningful (§4).

| Layer | Question | Typical subject |
|---|---|---|
| `app` | What is this built from? | A shipped application |
| `model` | What went into this model? | Model weights or a hosted model endpoint |
| `tool` | What does this touch when invoked? | An MCP server or toolset |
| `agent` | What may this actor do, and on what leash? | An agent *configuration* |
| `skill` | What will this teach my agent to do? | A packaged skill or instruction bundle |

Adding a layer requires the same three-part test the project already applies:
someone must need to trust the thing at install time; the essential facts must
be objective and at least partly machine-derivable; and no incumbent format must
already answer the question well. Failing the third test is not fatal *if* the
response is a profile rather than a new format.

---

## 3. The Panel structure

A Panel is a JSON object. It MUST validate against
`panel.schema.json` (JSON Schema draft-07).

```json
{
  "panel_version": "0.1.0",
  "layer": "agent",
  "subject": {
    "name": "GeoSpatial Route Planner Agent",
    "publisher": "example.com",
    "version": "1.2.0",
    "canonical_url": "https://georoute.example.com/.well-known/agent-card.json"
  },
  "rows": [
    { "key": "kind",        "label": "Kind",       "value": "remote-service", "type": "enum",   "severity": "info" },
    { "key": "shell",       "label": "Shell",      "value": "undisclosed",    "type": "undisclosed" },
    { "key": "network",     "label": "Network",    "value": "outbound",       "type": "enum",   "severity": "caution" },
    { "key": "auth",        "label": "Auth",       "value": ["oauth2"],       "type": "list",   "severity": "info" }
  ],
  "provenance": {
    "profile": "a2a-agent-card",
    "profile_version": "0.1.0",
    "source_format": "a2a/agent-card",
    "source_version": "1.0",
    "source_url": "https://georoute.example.com/.well-known/agent-card.json",
    "fetched_at": "2026-08-08T14:02:11Z",
    "content_digest": "sha256:9f2b…",
    "verification": "self-asserted",
    "signature": "verified",
    "signature_detail": "JWS, key resolved via publisher domain"
  },
  "freshness": {
    "etag": "\"a1b2c3\"",
    "ttl_seconds": 3600,
    "stale": false
  },
  "unmapped_fields": ["skills[].examples", "iconUrl"]
}
```

### 3.1 `subject`

`canonical_url` is REQUIRED and MUST point at the source document or its
human-readable home. A renderer MUST surface this link. A Panel that cannot be
traced back to a source is not conformant.

### 3.2 `rows`

Rows are the visible label. Constraints:

- `key` MUST come from the registry for the declared layer (§4). Unknown keys
  MUST NOT be emitted; they belong in `unmapped_fields`.
- `value` MUST be either a value from that key's closed enum, a scalar the
  source stated verbatim, a list of such, or the literal string `undisclosed`.
- `type` is one of `enum`, `scalar`, `list`, `undisclosed`.
- A Panel MUST NOT contain subjective claims. If it cannot be checked against
  the source document, it does not belong in a row.

### 3.3 `severity`

`severity` is one of `info`, `caution`, `danger`. It exists so a renderer can
color a row and a policy consumer can threshold on it.

**Severity MUST be assigned by the profile's fixed mapping table, never by the
author of a label.** `shell: true` is `danger` because the profile says so, for
every subject, always. This keeps the Golden Rule intact: the judgment lives in
a public, reviewable, versioned table rather than in per-label discretion.

Severity tables MUST ship in the profile document and MUST be diffable.

### 3.4 `provenance`

All fields REQUIRED except `signature_detail`.

**`verification`** — the single most important field in the Panel:

| Value | Meaning |
|---|---|
| `self-asserted` | The source document is a publisher's own claim. Nothing was checked. |
| `derived` | Values were computed from an observable artifact — a lockfile, a live `tools/list` response, a package manifest. |
| `attested` | Values carry a third-party claim the profile verified — a signed VC, a JWS with a resolvable key, a signed SBOM attestation. |

Mixed Panels take the **weakest** value present. A Panel that is 90% derived and
10% self-asserted is `self-asserted`.

**`signature`** is one of `none`, `present-unverified`, `verified`, `invalid`.
A profile MUST NOT report `verified` unless it actually resolved a key and
checked the signature. `invalid` MUST be rendered prominently and MUST NOT be
silently downgraded to `none`.

**`content_digest`** is the SHA-256 of the exact bytes fetched. This is what
binds a Panel to a specific document. A Panel without a digest MUST be treated
as unverifiable by policy consumers.

### 3.5 `freshness`

Profiles that fetch over HTTP MUST honor standard caching semantics and SHOULD
record `etag`. A Panel is `stale` when `fetched_at + ttl_seconds` is in the
past. Renderers MUST visibly mark stale Panels. A confidently wrong label is
worse than no label; staleness is the most likely way to produce one.

Policy consumers SHOULD refuse to gate on a stale Panel and SHOULD refetch.

### 3.6 `unmapped_fields`

Every field present in the source document and not represented in `rows` MUST be
listed. This is the Panel telling the reader what it dropped. It also makes
profile gaps visible as data rather than as silence, and gives upstream
maintainers a concrete diff when they review the profile.

---

## 4. Row key registry

Keys are namespaced per layer, closed, and versioned with the spec. A profile
MAY emit a subset. A profile MUST NOT invent keys.

### `tool`
`kind`, `runtime`, `transport`, `credentials`, `side_effects_worst`,
`filesystem`, `network`, `processes`, `egress_destinations`, `telemetry`,
`idempotent`, `license`

### `agent`
`kind`, `model_binding`, `tool_count`, `shell`, `browse`, `filesystem`,
`network`, `autonomy`, `self_looping`, `memory_persistence`, `telemetry`,
`data_shared`, `auth`, `license`

### `model`
`architecture`, `parameters`, `context`, `modalities`, `training_data_sources`,
`training_cutoff`, `license`, `weights_availability`, `safety_evaluations`,
`use_restrictions`

### `app`
`type`, `language`, `framework`, `dependency_count`, `direct_dependencies`,
`licenses_present`, `network_endpoints`, `telemetry`, `build_provenance`

### `skill`
`kind`, `shell`, `network`, `filesystem`, `tools_required`, `install_scope`,
`license`

Enum vocabularies for each key live in `enums.json` and are normative.
Adding a key or an enum member is a minor version bump. Removing or
re-meaning one is a major bump.

---

## 5. Profiles

A profile is a document plus a mapping implementation. Each profile MUST specify:

1. **Identifier and version.** e.g. `a2a-agent-card@0.1.0`.
2. **Source format and version range.** What it reads, and which upstream
   versions it claims to handle.
3. **Discovery.** How to locate the source document from a user-supplied input
   (a well-known path, a registry lookup, a repo file convention, a live
   endpoint call).
4. **Field mapping.** Source field → row key → enum member. Exhaustive and
   one-directional.
5. **Severity table.** Per §3.3.
6. **Verification determination.** How the profile decides `self-asserted` vs
   `derived` vs `attested`, and what signature checking it performs.
7. **Conservative-collapse rule.** When several source values map to one row,
   the profile MUST emit the harsher value. `read` plus `write` is `write`.
   Ambiguity resolves toward caution, never toward reassurance.
8. **Attribution string.** Per §7.

Profiles MUST NOT infer. If a source document does not state whether a tool
touches the filesystem, the row is `undisclosed` — not `none`. Inference is the
failure mode that turns a label into a liability.

### 5.1 Initial profile set

| Profile | Source | Layer | Verification ceiling | Notes |
|---|---|---|---|---|
| `mcp-tools-list` | Live MCP `tools/list` + annotations | `tool` | `derived` | Highest-value profile. Observes a running server rather than reading a claim. |
| `a2a-agent-card` | `/.well-known/agent-card.json` | `agent` | `attested` | Also accept the legacy `/.well-known/agent.json` path. Card `signatures` (JWS) enable `attested`. |
| `nanda-agentfacts` | NANDA registry record | `agent` | `attested` | JSON-LD / W3C Verifiable Credentials. Requires upstream contact before shipping (§7). |
| `hf-model-card` | Hugging Face model card YAML | `model` | `self-asserted` | Widest install base of any model metadata. |
| `cyclonedx-sbom` | CycloneDX JSON | `app` | `derived` | Generated from real dependency graphs. |
| `spdx-sbom` | SPDX 2.3+ / 3.0 AI profile | `app` / `model` | `derived` | The SPDX AI profile overlaps the `model` layer; map both. |
| `tool-facts` | `TOOL_FACTS.md` | `tool` | `self-asserted` | **Native.** The one place xFacts still defines a format. |

Ship `mcp-tools-list` first. It is the only profile that produces a `derived`
Panel from a live endpoint with no publisher cooperation at all, which makes it
the only one that can demonstrate the whole thesis on day one.

### 5.2 Native profiles

A native profile is permitted only where §2's three-part test passes *and* no
adaptable format exists. Native profiles MUST be visually and structurally
marked as native in every renderer, so a reader can tell "we read someone's
published data" from "we defined this ourselves."

`tool-facts` is native because MCP annotations are optional, sparsely set, and
carry no per-tool egress or credential detail. It remains a stopgap: if the MCP
specification grows equivalent fields, `tool-facts` SHOULD be deprecated in
favor of a `mcp-*` profile rather than defended.

---

## 6. Conformance

### 6.1 Conformant profile

- Emits Panels that validate against `panel.schema.json`.
- Emits only registered row keys and enum members for the declared layer.
- Emits `unmapped_fields` completely.
- Never infers absent facts; emits `undisclosed`.
- Applies the conservative-collapse rule.
- Passes the profile's published test vectors: for each vector, a fixed source
  document produces a byte-identical Panel modulo `fetched_at`.

### 6.2 Conformant renderer

- Displays `subject.canonical_url` as a link.
- Displays `provenance.verification` with equal prominence to the rows. A
  `self-asserted` Panel that looks identical to an `attested` one is a
  non-conformant rendering.
- Marks stale Panels visibly.
- Marks native profiles distinctly from adapted ones.
- Does not reorder or omit `danger` rows.

### 6.3 Conformant policy consumer

- Refuses to gate on a Panel with no `content_digest`.
- Treats `undisclosed` as at least as restrictive as the harshest enum member
  for that key. `undisclosed` is not `none`.
- Refetches rather than acting on a stale Panel.

---

## 7. Upstream relations

This is a specification requirement, not etiquette.

- A profile for a third-party format MUST carry a non-endorsement notice and
  MUST link to the upstream project's canonical home.
- A profile MUST NOT present itself as an official implementation, registry, or
  successor of the format it reads.
- A profile for an actively maintained format SHOULD NOT ship before its
  maintainers have been contacted. Their objections take precedence; a profile
  they reject SHOULD be withdrawn.
- Domain names used for viewers MUST NOT imply ownership of an upstream
  project's name. Where a domain matches an existing project's term, the site
  MUST state its unofficial status above the fold.
- Panels MUST NOT be republished as a format of record. xFacts hosts views;
  publishers host truth.

---

## 8. Distribution surfaces

These consume Panels; they are not part of the Panel definition.

- **Viewer** (`/v`) — renders a Panel from a URL or a self-contained encoded
  fragment. Portable, no server state.
- **Badge** — an SVG summarizing the harshest severity and the `verification`
  value. The verification value MUST appear on the badge; a badge that shows
  only "labeled" is a badge that launders self-assertion.
- **Validator / CI action** — refetches the source, recomputes the digest, and
  fails when the labeled artifact has moved. This is the anti-staleness gate
  and SHOULD be the first tool shipped after the first profile.
- **Policy adapter** — maps a Panel to an approval decision for a host or
  harness. The shape of this output should be determined by an actual harness
  author before it is designed.

---

## 9. Open questions for 0.2

1. Should `severity` tables be per-profile or global per row key? Global is more
   comparable across profiles; per-profile is more honest about differing source
   semantics.
2. What is the right response when two profiles disagree about the same subject
   — for instance an Agent Card claiming no network while its MCP toolset
   observably makes outbound calls? A `conflicts` block is the obvious answer
   and is also the most useful thing the project could produce.
3. Should Panels be signable by the renderer, producing a chain of "xFacts
   observed this document at this time with this digest"? That would let a
   Panel be cached and forwarded without re-fetching.
4. Does the `app` layer survive contact with SBOM tooling, or is it better
   expressed as a rendering profile over CycloneDX with no independent identity?

---

## 10. Changelog

- **0.1.0-draft** — Initial specification. Reframes xFacts from a family of
  original formats to a Panel shape plus a profile set, with one native profile
  retained.
