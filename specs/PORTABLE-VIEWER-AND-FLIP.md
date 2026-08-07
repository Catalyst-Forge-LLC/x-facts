# Portable viewers + flip-to-raw — suite spec

> Cross-label plan to bring AppFacts-style hash viewers to ToolFacts, AgentFacts,
> and SkillFacts; wire exemplars into that view mode; and add a flip-to-raw /
> copy-to-clipboard UX on every viewer including AppFacts.
>
> **Out of scope this round: ModelFacts.** Its catalog + `facts.json` path is the
> special case; a ModelFacts `/v` may be considered later and is not required here.

**Status:** implemented for App/Tool/Agent/Skill (ModelFacts still skipped).  
**Owner:** Catalyst Forge / xFacts suite.  
**Depends on:** AppFacts `SPEC-af1.md` + `site/v/` as the reference implementation.  
**Related:** prior flesh-out in [`SUITE-FLESH-OUT-2026-08.md`](./SUITE-FLESH-OUT-2026-08.md).

---

## 1. Goal

Humans and agents should open any curated exemplar (and later any generated label)
as a **portable nutrition card** that:

1. Lives entirely in the URL fragment (no backend, AppFacts `/v` pattern).
2. Renders the **human label face** first.
3. Lets the user **flip** to the **raw** face (YAML frontmatter + optional Markdown
   body reconstruction, or a faithful raw dump).
4. Offers **copy to clipboard** for the raw face (and optionally the share URL).

Exemplars on each label site must deep-link into this viewer, not only to raw
`.md` files in `/examples/`.

---

## 2. Non-goals

| Non-goal | Why |
|---|---|
| ModelFacts `/v` in this round | Directory + `facts.json` already serves agents; payload size/catalog UX differ. |
| Server-side storage of labels | Fragment-only; no-backend guarantee stays. |
| Verified / certified payloads | Trust banner remains; payload is untrusted user-controlled data. |
| Replacing `/examples/*.md` | Raw Markdown stays the canonical git/source artifact; viewer is the share/skim surface. |
| Full generator QR pipelines for tool/agent/skill | Nice follow-on; this spec requires encode helpers enough to ship exemplar links. |

---

## 3. Shared URL + codec contract

### 3.1 URL shape

```
https://{label}.dev/v#{prefix}.{payload}
```

| Label | Origin path | Fragment prefix | Inner `v` |
|---|---|---|---|
| AppFacts | `https://appfacts.dev/v` | `af1.` | `1` (existing) |
| ToolFacts | `https://toolfacts.dev/v` | `tf1.` | `1` |
| AgentFacts | `https://agentfacts.dev/v` | `ag1.` | `1` |
| SkillFacts | `https://skillfacts.dev/v` | `sf1.` | `1` |

Decoders **MUST** reject unknown prefixes with a clear “update your viewer” message
(same posture as AppFacts `af1`).

### 3.2 Encode / decode (family-identical)

Same pipeline as [`app-facts/SPEC-af1.md`](../../app-facts/SPEC-af1.md):

1. Build compact JSON (per-label schema below).
2. `JSON.stringify` with no insignificant whitespace.
3. zlib compress (RFC 1950 / browser `CompressionStream("deflate")` twin).
4. base64url, strip `=` padding.
5. Prefix + place after `#`.

Decode is the reverse (`DecompressionStream("deflate")`). Nothing from the fragment
is stored by the host as part of normal operation.

### 3.3 Size guidance

Target full URL length **≤ 1600 characters** when a QR is intended.

ToolFacts is the stress case (many tools). Progressive shrinkage **SHOULD**:

1. Drop optional identity URLs (`homepage`, `repository`).
2. Keep all tools but drop per-tool `purpose` strings.
3. Cap tools to the first N that include every `destructive`/`write` tool, then
   highest-risk remainder (document the algorithm in `SPEC-tf1.md`).
4. If still over limit, emit best-effort and mark the raw face with
   `truncated: true` in the compact payload so the UI can say the portable card is
   incomplete vs the full `TOOL_FACTS.md`.

AgentFacts / SkillFacts rarely need shrinkage; still document the same ceiling.

---

## 4. Compact payload schemas (v1)

Normative detail lives in each label repo (`SPEC-af1.md` already; add
`SPEC-tf1.md`, `SPEC-ag1.md`, `SPEC-sf1.md`). Summary for implementers:

### 4.1 AppFacts `af1` (existing)

Unchanged keys: `v, name, type, status, license, stack, deps, svc?, build?,
homepage?, repository?`.

**Enhancement (non-breaking):** optional `raw` string (see §5) may be added later
for flip-to-raw fidelity. Prefer reconstructing a Markdown document from compact
fields when `raw` is absent so old QR links keep working.

### 4.2 ToolFacts `tf1` (new)

| Key | Source | Notes |
|---|---|---|
| `v` | payload | `1` |
| `name`, `developer`, `version`, `status`, `license`, `kind` | identity | required |
| `runtime` | `{e,t}` or full `{execution,transport}` | prefer short keys if needed |
| `credentials` | `{required: string[]}` | |
| `egress` | `{telemetry, destinations}` | |
| `tools` | array of `{n,p?,se,r:{fs,net,proc},idemp}` | compact names OK |
| `homepage?`, `repository?` | optional | |
| `truncated?` | boolean | set when shrinkage dropped tools/purposes |
| `raw?` | string | optional full Markdown for flip face |

### 4.3 AgentFacts `ag1` (new)

Compact the six groups: `model`, `tools` (rollup), `reach`, `autonomy`, `memory`,
`egress`, plus identity. Keep enums as short strings identical to frontmatter
values (do not invent a second vocabulary). Optional `raw`, `truncated`.

### 4.4 SkillFacts `sf1` (new)

Compact: identity + `purpose`, `provenance`, `instructions_reach`,
`tools_referenced`, `bundled_artifacts`, `egress`. Optional `raw`, `truncated`.

### 4.5 Short-key policy

- Prefer **readable full keys** when URL budget allows (easier debug).
- Allow documented short aliases in each `SPEC-*1.md` only where ToolFacts size
  forces it; decoders accept both.

---

## 5. Viewer UX (all four labels)

### 5.1 Layout

`/v` is a dedicated static page (copy AppFacts shell: brand link home, dark ink,
label accent per site).

States:

1. **Missing hash** — friendly empty state + link to exemplars / home.
2. **Decode error** — message + expected URL shape.
3. **Label face (default)** — nutrition card from compact JSON.
4. **Raw face** — flipped card showing source text.

### 5.2 Flip control

- A single control: **Flip** / **Show label** (toggle).
- Visual metaphor: card flips (CSS 3D rotateY or equivalent). Respect
  `prefers-reduced-motion` (cross-fade or instant swap instead of 3D).
- Aria: `aria-pressed` on the toggle; announce face change politely.
- Persist face in the URL **without destroying the payload**, e.g. query
  `?face=raw` **or** a secondary hash convention — prefer **query**
  (`/v?face=raw#tf1.…`) so payload decode stays simple.

### 5.3 Raw face content

Priority:

1. If compact payload includes `raw`, show that string verbatim.
2. Else **reconstruct** a Markdown document with YAML frontmatter from compact
   fields (good enough for copy/share; may differ from hand-authored body prose).
3. Show a one-line note when `truncated: true`.

Default tab/view inside raw face: full Markdown. Optional sub-toggle
**Frontmatter only** is nice-to-have, not required for v1.

### 5.4 Copy to clipboard

- Icon button on the raw face (and available on the label face as “Copy raw”).
- Copies the raw Markdown string (same as raw face contents).
- Optional second action: **Copy link** (current URL including face query).
- Feedback: brief “Copied” state; never use `alert()`.
- If Clipboard API unavailable, select text in a readonly `<textarea>` fallback.

### 5.5 Trust / safety (inherit AppFacts)

- Trust banner: untrusted payload, not verified by the site.
- Homepage never clickable on shared-domain viewers.
- Repository links only for known code hosts (reuse AppFacts allowlist).
- Strict CSP on `/v` (`connect-src 'none'` where already used).
- Escape all rendered strings.

---

## 6. Exemplar integration

For ToolFacts, AgentFacts, SkillFacts (and optionally AppFacts examples):

1. Each exemplar remains canonical as `examples/<slug>/{LABEL}_FACTS.md`.
2. `site/examples/index.json` gains per-entry:
   - `viewer` — absolute or site-root URL to `/v?…#…` for that exemplar.
3. Landing `#examples` lists open the **viewer** as primary CTA; secondary link
   “Raw Markdown” → `/examples/<slug>/…md`.
4. Commit a small encode script or checked-in generated fragment map
   (`site/examples/viewer-links.json` or fields inside `index.json`) so Pages
   deploys do not need a build step at request time.
5. Empty `/v` page should link to the exemplar ladder.

**AppFacts:** update example/docs CTAs similarly where a portable link already
exists; ensure the new flip/copy UX is obvious on scanned QR opens.

---

## 7. Work per repository

| Repo | Deliverables |
|---|---|
| **app-facts** | Enhance `site/v/index.html`: flip + raw reconstruct + copy (+ Copy link). Amend `SPEC-af1.md` with optional `raw` / face query. Optional: exemplars link polish. |
| **tool-facts** | `SPEC-tf1.md`, `site/v/index.html`, encode helper (JS in-repo, zero/low deps), wire 5 exemplars + index.json + site CTAs + `_headers` CSP for `/v`. |
| **agent-facts** | Same pattern with `ag1` + 5 exemplars. |
| **skill-facts** | Same pattern with `sf1` + 4 exemplars. |
| **x-facts** | This suite spec; hub copy may mention portable labels in one line later (no viewer on the hub). |
| **model-facts** | **No change** this round. Optional future note in ModelFacts roadmap only. |

Shared implementation advice: extract a tiny `viewer_codec` pattern from
`app-facts/generator/viewer_codec.js` into each repo (copy, do not create a
monorepo package yet). Keep Pages “no build” for `site/`.

---

## 8. Phases

| Phase | Work | Exit |
|---|---|---|
| **A. Spec freeze** | This doc + per-label `SPEC-{tf,ag,sf}1.md` drafts | Prefixes + compact keys agreed |
| **B. AppFacts UX** | Flip + raw + copy on existing `/v` | Old `af1` links still render; flip works offline |
| **C. ToolFacts viewer** | `/v`, codec, exemplar viewer URLs | All 5 exemplars open label face; flip shows raw |
| **D. AgentFacts viewer** | Same | All 5 kinds |
| **E. SkillFacts viewer** | Same | All 4 skills |
| **F. Polish** | reduced-motion, CSP, llms.txt mention of `/v`, README roadmap checks | Acceptance below green |

Implementation order preference: **B → C → D → E** (AppFacts proves UX; ToolFacts
proves size stress; Agent/Skill copy the shell).

---

## 9. Acceptance criteria

- [x] AppFacts `/v#af1.…` still works for existing payloads.
- [x] AppFacts viewer has flip-to-raw + copy-to-clipboard (+ copy link optional).
- [x] ToolFacts / AgentFacts / SkillFacts each ship `/v` decoding their prefix only.
- [x] Every curated exemplar has a primary “Open label” control that lands on `/v`
      with a valid fragment (and optional `?face=raw`).
- [x] Flip reveals reconstructed or embedded raw Markdown; copy puts that text on
      the clipboard.
- [x] Trust banner + link safety rules match AppFacts.
- [x] `/v` CSP remains strict; no network fetch required to render a hash payload.
- [x] ModelFacts untouched.
- [x] Specs/schemas stay CC0; no “certified” language.

---

## 10. Agent notes

Agents should still prefer `/examples/<slug>/{LABEL}_FACTS.md` or future
`facts.json` for tooling. The hash viewer is primarily a **human share/skim**
surface; agents may decode fragments when handed a `/v#…` URL, using the same
zlib/base64url rules.

Update each label `llms.txt` with one line:

> Portable viewer: `/v#{prefix}.…` (human skim; exemplars also at `/examples/`).

---

## 11. Open questions

1. **Embed `raw` in every exemplar payload?**  
   Pros: flip matches git file exactly. Cons: URL size (ToolFacts).  
   **Default:** reconstruct for portable links; embed `raw` only when under budget
   (SkillFacts / small AgentFacts).

2. **Flip animation intensity** — subtle 3D vs instant. Default: short 3D with
   reduced-motion fallback.

3. **Should AppFacts generator start emitting `raw`?** Not required for UX phase;
   reconstruct is enough for v1 flip.

4. **Hub demo** — one composite screenshot or link row on xfacts.dev? Optional
   later; hub stays meat-free.

---

## 12. Completions

| Item | Status |
|---|---|
| Suite spec written (`x-facts/specs/PORTABLE-VIEWER-AND-FLIP.md`) | done |
| `SPEC-tf1.md` / `SPEC-ag1.md` / `SPEC-sf1.md` | done |
| AppFacts flip + copy | done |
| ToolFacts `/v` + exemplar wiring | done |
| AgentFacts `/v` + exemplar wiring | done |
| SkillFacts `/v` + exemplar wiring | done |
| ModelFacts | explicitly skipped |

---

## License

Documentation for the open suite. Per-label viewer payload specs will be CC0 when
landed beside each label SPEC.
