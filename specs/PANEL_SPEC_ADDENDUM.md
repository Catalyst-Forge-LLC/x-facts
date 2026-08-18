# Addendum: Implementation Guidance for xFacts Panel Specification 0.1.0-draft

> **Superseded.** Implementation order, canonicalization, `subject_identity`,
> and validator rules now live in [`PANEL.md`](./PANEL.md) §§5–7. Keep this
> file for history.

**Status:** Superseded by `PANEL.md`.
**Audience:** Implementers and coding agents.
**Purpose:** Turn the specification into an ordered set of concrete deliverables. This document does not change normative requirements; it prioritizes and constrains work.

---

## 1. Implementation priorities (strict order)

Work proceeds in this sequence. Do not start later items until the previous milestone is functional and has test vectors.

0. **Consumer review.** Show the Panel shape to at least one MCP host or agent harness author and record what they say.
1. **Core Panel schema + `mcp-tools-list` profile** — developed together as a single loop (see §1.1)
2. **Validator / CI action** — digest integrity and row-level drift
3. **Minimal viewer** (`/v`) that renders a Panel with required prominence rules
4. **Badge** (SVG) that surfaces both severity and verification status
5. **Native `tool-facts` profile** (explicitly marked as native/stopgap)
6. Only after the above: additional profiles (`a2a-agent-card`, `hf-model-card`, etc.)

`mcp-tools-list` is the demonstration that the entire thesis works. Everything else is secondary until it exists.

### 1.1 Why step 0 comes first

The specification's own non-goals forbid shipping a policy adapter until a harness author has reviewed the Panel shape. That review cannot come last. The consumer determines the output shape; a schema frozen before the consumer is heard is a schema that gets rewritten after four dependent artifacts have been built on it.

Step 0 costs an email. It is the only input capable of invalidating steps 1 through 4, so it must precede them. Record the response — including "no reply" — in the repository. A documented non-response is a valid outcome and lets work continue; an unasked question is not.

### 1.2 Why steps 1 and 2 are one loop

Schema and first profile cannot be sequenced. Row keys and enum members are hypotheses about what real source documents contain, and the first live `tools/list` response will falsify some of them. Building the schema to completion before the profile guarantees rework; building the profile against a frozen wrong schema guarantees bad mappings.

Treat them as one milestone with a single exit criterion:

> Three structurally different real MCP servers each produce a valid Panel, and no new enum member or row key has been required for the most recent two.

Until that holds, both artifacts stay editable. After it holds, the schema is frozen for the cycle and every subsequent milestone gates hard against it.

---

## 2. First milestone deliverables

### 2.1 Schema and enums

- `panel.schema.json` (JSON Schema draft-07) matching §3 of the specification.
- `enums.json` containing the closed vocabularies for every registered row key in the **`tool` layer only**. Other layers are not stubbed and not designed in this cycle.
- A small set of golden Panel examples (valid and invalid) used as test fixtures.

**Do not author `agent` enums in this milestone.** No agent profile ships in this cycle, so an agent vocabulary would be designed with no consumer and no source document to check it against — the exact failure the project reframe was meant to eliminate. Agent enums are designed alongside `a2a-agent-card`, from real Agent Cards.

### 2.2 `mcp-tools-list` profile

Must implement all eight requirements in §5 of the specification.

Minimum behavior:

- Accept a live MCP server endpoint (stdio or HTTP transport).
- Call `tools/list` and read any annotations present.
- Map to `tool` layer row keys only.
- Produce a Panel with:
  - `verification: "derived"`
  - a `content_digest` computed per §2.2.1
  - a `subject_identity` block per §2.2.2
  - complete `unmapped_fields`
  - conservative collapse (worst side effect, broadest reach)
- Never invent values. Missing information → `undisclosed`.
- Emit a fixed attribution string and non-endorsement notice.

#### 2.2.1 Canonicalization (required before any digest work)

A raw-bytes digest over a `tools/list` response is not reproducible. JSON-RPC responses carry a per-call `id`, object key ordering is not guaranteed by the protocol or by most serializers, and tool array ordering is not specified. A digest taken over raw bytes will differ between two identical calls to the same server, and the byte-identical test vectors this addendum requires cannot be produced.

The profile MUST digest a canonical form, derived as follows:

1. **Strip the transport envelope.** Discard the JSON-RPC wrapper — `jsonrpc`, `id`, and any framing — and retain only the `result` payload.
2. **Sort the tool array** lexicographically by `name` (UTF-8 code point order).
3. **Canonicalize** the resulting document per JCS (RFC 8785): lexicographic key ordering, specified number formatting, no insignificant whitespace.
4. **Digest** the UTF-8 bytes of that canonical form with SHA-256.

The profile MUST record `digest_canonicalization: "jcs-rfc8785+envelope-stripped+tools-sorted"` in `provenance` so a verifier can reproduce the computation. Any future change to this procedure is a major version bump of the profile.

Test vectors are byte-identical Panels modulo `fetched_at` **after** canonicalization. A vector suite that passes without canonicalization is testing the wrong thing.

#### 2.2.2 `subject_identity` — what the digest does not cover

The canonical digest binds a Panel to *what a server said*, not to *what the server is*. Two different builds can emit identical `tools/list` output; a rebuilt server with a backdoored implementation and an unchanged tool surface produces an unchanged digest. For a locally spawned stdio process this is a material gap, and it leaves the tool layer with a weaker identity story than the Agent Card layer it is meant to outclass.

The profile MUST therefore also record whatever package identity is observable:

```json
"subject_identity": {
  "package": "npm:@example/mcp-filesystem",
  "version": "0.4.2",
  "resolved_integrity": "sha512-…",
  "binary_digest": "sha256:…",
  "identity_confidence": "resolved"
}
```

- `identity_confidence` is one of `resolved`, `partial`, `unknown`.
- `resolved` requires a package coordinate with a version **and** an integrity hash or binary digest.
- Fields that cannot be observed are omitted; the block itself is REQUIRED, and `identity_confidence: "unknown"` is a valid and honest value.
- Policy consumers SHOULD treat `unknown` identity as grounds for prompting even when all rows are `info`.

### 2.3 Validator / CI action

The validator performs **two distinct checks**. Conflating them produces alerts nobody can act on.

**Check A — integrity (for cached or forwarded Panels).** Given a Panel and its source document, recompute the canonical digest and compare. A mismatch means the Panel does not describe the document it claims to describe. This is a tampering and staleness check for Panels that have travelled — served from a registry, embedded in a README, cached by a host.

**Check B — drift (for live endpoints).** Re-run the profile against the live server, produce a fresh Panel, and **diff the rows**. Report at row granularity:

- rows added or removed
- any row whose `severity` increased
- any row that moved from a permissive enum member to a harsher one
- any change to `subject_identity`

Row-level drift is the actionable signal. "This server gained a `destructive` tool since you approved it" is what an operator needs; "the digest changed" is not, because for a live endpoint it fires on a version-string bump as readily as on a new shell-executing tool.

Exit codes MUST distinguish the two: integrity failure, severity-increasing drift, and non-severity drift are three different outcomes and CI should be able to gate on them separately. Exit non-zero on any conformance violation in §6.1 and §6.3 of the specification.

### 2.4 Minimal viewer

- Renders a Panel from a URL or a self-contained fragment.
- MUST display:
  - `subject.canonical_url` as a live link
  - `provenance.verification` with equal visual weight to the rows
  - `subject_identity.identity_confidence` where it is not `resolved`
  - visible stale marking
  - clear distinction if the profile is native
- MUST NOT hide or de-emphasize `danger` rows or an `invalid` signature.
- No login, no persistent server state required for the basic `/v` path.

---

## 3. Native `tool-facts` profile rules

- Treat as a stopgap only.
- Every renderer and badge MUST visually mark it "native / xFacts-defined".
- Do not invest in rich authoring UX yet.
- If MCP later gains equivalent structured fields, this profile is to be deprecated, not defended.
- Keep the mapping deliberately conservative and the surface area small.

---

## 4. Required conventions for all profiles

Every profile implementation MUST include:

- A versioned identifier (`name@version`)
- An exhaustive field-mapping table (source → row key → enum)
- A severity mapping table (public, diffable)
- A conservative-collapse rule statement
- A verification decision procedure
- A documented canonicalization procedure for its digest
- At least three test vectors (source document → expected Panel)
- The non-endorsement / upstream link text required by §7 of the specification

Profiles that cannot produce a reproducible `content_digest` are non-conformant and must not be shipped.

---

## 5. Decisions that must be made before coding further profiles

These gate specific work rather than all work. Over-coupling stalls the roadmap.

| Decision | Gates | Does not gate |
|---|---|---|
| Severity tables: global per row key, or per-profile? (Recommendation: global with documented overrides.) | Any second profile | — |
| Shape of a `conflicts` block when two profiles disagree about one subject | Any second profile in a layer already covered | The first profile in a new layer |
| Whether `app` remains a first-class layer or becomes a rendering profile over CycloneDX/SPDX | `cyclonedx-sbom`, `spdx-sbom` | `a2a-agent-card`, `nanda-agentfacts`, `hf-model-card` |

The `app` layer question has no bearing on the agent-layer profiles and must not hold them up.

---

## 6. Explicit non-goals for the first implementation cycle

- Do not build a general authoring UI for hand-written labels.
- Do not create new native formats beyond the existing `tool-facts` stopgap.
- Do not claim endorsement or official status for any upstream format.
- Do not ship a policy-engine adapter until a real harness author has reviewed the Panel shape (§1, step 0).
- Do not prioritize Skill or full Model layer work until the tool path is proven.
- Do not design enum vocabularies for layers with no profile in this cycle.

---

## 7. Success criteria for "0.1 usable"

Internal criteria — all must hold:

- `mcp-tools-list` can be pointed at a running MCP server and produces a valid, derived Panel with a reproducible digest and a `subject_identity` block.
- Canonicalization is implemented and two consecutive runs against an unchanged server produce identical digests.
- The validator distinguishes integrity failure from row-level drift, with separate exit codes.
- The viewer renders verification status, identity confidence, and danger rows with correct prominence.
- Native vs adapted profiles are visually distinct.
- Test vectors exist and are checked in CI.

External criteria — both must hold:

- At least one MCP host or agent harness author has reviewed the Panel shape and their response is recorded in the repository.
- At least one MCP server maintainer has been shown the Panel generated from their own server and has not objected to its accuracy.

The external criteria are not optional. Every internal criterion above can be satisfied without a single person outside the project seeing the work, which makes them a poor test of whether the work is right. The second external criterion is cheap, catches mapping errors that are invisible from inside, and starts the upstream relationship §7 of the specification requires in any case.

---

## 8. Suggested repository layout (informative)

```
/specs
  panel.schema.json
  enums.json
  profiles/
    mcp-tools-list/
      profile.md
      mapping.json
      severity.json
      canonicalization.md
      test-vectors/
/tools
  validate/          # check A: integrity
  drift/             # check B: row-level diff
  fetch-and-panel/
/viewer
  (minimal static or edge viewer)
/badge
/reviews
  (recorded consumer and upstream responses)
```

Exact structure may vary; the required artifacts above matter more than directory names.

---

This addendum is the implementation contract. Talk to a consumer before freezing the schema, canonicalize before digesting, keep native profiles marked, and treat test vectors, digests, and the external success criteria as non-negotiable.
