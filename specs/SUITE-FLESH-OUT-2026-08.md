# Suite flesh-out — task, phases, findings, completions

> Working spec for the 2026-08 session that reviews and fleshes out ToolFacts,
> AgentFacts, and SkillFacts (with light hub updates to xFacts). ModelFacts is
> reference-only; another agent owns active development there.

**Status:** complete for this session (local scaffold; deploy/remotes still owner-owned).  
**Owner session:** agent working from `x-facts` with sibling repos as peers.  
**Sponsor context:** Catalyst Forge suite vision
(`catalyst-forge/docs/xfacts-suite-vision.md`).

---

## 1. Task (what you were asked to do)

1. Familiarize with **x-facts** (hub) and siblings: **app-facts**, **model-facts**,
   **tool-facts**, **agent-facts**, **skill-facts**, plus **catalyst-forge**.
2. Review the three bare / underbuilt labels (**tool**, **agent**, **skill**).
3. Write review + change plans under each project's `specs/` folder.
4. Carry the plans out: enough substance for a first useful deployment, including
   **3–5 exemplars** per label covering distinct types.
5. Optionally improve **x-facts** as a hub (no repeating label meat).
6. Keep the family file contract: `{LABEL}_FACTS.md` with **YAML frontmatter as
   sole source of truth** + rendered Markdown body (same as AppFacts / ModelFacts).

### Constraints from the owner

| # | Decision |
|---|---|
| 1 | Gold standard = AppFacts + ModelFacts (first-deployment quality). |
| 2 | Ship real exemplars that support the format, not empty scaffolding. |
| 3 | Do not invent a new fact-file shape; stay on frontmatter + body. |
| 4 | Depth ≈ AppFacts/ModelFacts; also include criteria a careful agent would want. |
| 5 | ModelFacts: read-only reference. |
| 6 | xFacts stays a hub. |
| 7 | ~3–5 exemplars of various types (ModelFacts-scale catalogs are out of scope). |

---

## 2. Phases

| Phase | Work | Exit |
|---|---|---|
| **A. Recon** | Map each sibling: SPEC/schema/examples/site/validator/generator; note suite vision + GENESIS boundaries. | Findings written below. |
| **B. Specs** | `specs/REVIEW-AND-PLAN.md` in tool/agent/skill; this meta-spec; optional hub plan. | Plans agreed by execution (no separate approval gate). |
| **C. ToolFacts** | Multi-type exemplars, agent surfaces (`llms.txt`, examples index), site/README/NOTES updates. | Validator green on all exemplars. |
| **D. AgentFacts** | Multi-kind exemplars composing ToolFacts where useful; same agent surfaces. | Validator green; kinds cover the enum spread. |
| **E. SkillFacts** | Formal SPEC + schema + validator + template + exemplars + real landing (leave reserved stub). | Validator green; README no longer "reserved only". |
| **F. Hub** | Status/copy refresh; optional `llms.txt` family pointer; no duplicated label docs. | Hub reflects new maturity honestly. |
| **G. Close** | Update Completions in this file; commit per repo (no push unless asked). | Specs say what shipped. |

---

## 3. Findings (recon)

### Suite posture

- Shared skeleton is stable: frontmatter SoT, Golden Rule, `undisclosed`, closed
  enums, CC0 spec/schema + MIT tooling, AppFacts design system + per-label accent,
  family footer owned by x-facts.
- Dual audience is the product: humans skim the body; agents/harnesses parse
  frontmatter / schema / (where present) JSON indexes.
- Vision: disclosure → policy input (ToolFacts approvals first).

### Maturity before this session

| Repo | Before |
|---|---|
| **app-facts** | Live gold standard: SPEC, schema, generator, `/v`, badges, one strong exemplar. |
| **model-facts** | Strong catalog + agent contract (`llms.txt`, `index.json`, compare). Reference only. |
| **tool-facts** | SPEC/schema/validator/site + **one** ForgeKit exemplar + template. Generator stub. No remote. |
| **agent-facts** | Twin of tool-facts + one ForgeKit Reference Agent. Generator stub. No remote. |
| **skill-facts** | Reserved stub: GENESIS + thin landing. No SPEC/schema/validator/examples. |
| **x-facts** | Hub + canonical footer. Status table understated tool/agent (still "spec in progress"). |

### What an expert agent wants from each layer

| Label | Decision questions |
|---|---|
| **ToolFacts** | Worst `side_effects`? FS / network / processes? Credentials? Egress hosts? Idempotent enough to auto-approve? |
| **AgentFacts** | Kind + leash (`autonomy`)? Blast radius? Shell/browse? Self-loop? Memory location? Egress? Links to ToolFacts / ModelFacts? |
| **SkillFacts** | What will instructions teach? Implied shell/network/FS? Bundled scripts/binaries? Tools named? Provenance? |

### Gaps this session targets (not full generators / live directories)

1. **Exemplar diversity** (3–5 types each) so the schema is taught by examples.
2. **Agent entrypoints** on each label site (`llms.txt` + fetchable examples index).
3. **SkillFacts v0.1** formalization (GENESIS already drafted taxonomy; owner asked to build now).
4. **Hub honesty** about status without pasting label meat.

Explicitly **deferred** (still on roadmaps): MCP generator, shared crawl directories,
portable `/v` badges, deploy/DNS/GitHub remotes, SkillFacts generator.

---

## 4. Completions

Update as work lands.

| Item | Status |
|---|---|
| Recon of suite + siblings | done |
| `x-facts/specs/SUITE-FLESH-OUT-2026-08.md` (this file) | done |
| `x-facts/specs/HUB-UPDATES.md` | done |
| `tool-facts/specs/REVIEW-AND-PLAN.md` | done |
| `agent-facts/specs/REVIEW-AND-PLAN.md` | done |
| `skill-facts/specs/REVIEW-AND-PLAN.md` | done |
| ToolFacts: 4–5 exemplars + site examples + `llms.txt` | done |
| AgentFacts: 4–5 exemplars + site examples + `llms.txt` | done |
| SkillFacts: SPEC, schema, validator, exemplars, site | done |
| Validators green on all new exemplars | done |
| Commits in touched repos | done (local only; not pushed) |

---

## 5. Agent consumption contract (session default)

For each label site after this work:

1. `GET /llms.txt` — short pointer.
2. `GET /examples/index.json` — curated exemplar catalog (slug, worst risk signals).
3. `GET /examples/<slug>/{LABEL}_FACTS.md` — full label.
4. `GET /schema/{label}-facts.schema.json` — validate frontmatter.

Do not scrape marketing HTML for facts.

---

## License

This working spec is documentation for the open suite (same spirit as hub docs).
Label SPECs/schemas remain CC0 where declared in each repo.
