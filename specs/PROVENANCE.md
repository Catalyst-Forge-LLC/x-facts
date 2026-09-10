# Provenance and review identity

How to tell what an xFacts label describes, and when. This is suite guidance, not a
new schema and not a certification program.

**Status:** documentation of current fields, plus compatible proposals.  
**Date:** 2026-09-10.

## Use the fields that already exist

| Need | Existing fields | Notes |
|---|---|---|
| What product or package | `name`, optional `homepage` / `repository` | Present on every label family |
| Which format | `{label}_facts_version` | File-format version, not the product version |
| Which product version | AppFacts: none today. AgentFacts / SkillFacts: optional or required `version` | See proposal A |
| When the file was written | `generated.date`, `generated.generator` | Generation or hand-author date, not a review stamp |
| Whether scanned inputs changed | AppFacts `generated.inputs_fingerprint` plus `--check` | Detects input drift, not body-vs-frontmatter drift, and not semantic truth |
| Where a skill came from | SkillFacts `provenance.source`, `provenance.publisher` | Use `undisclosed` when unknown |
| What a skill package included | SkillFacts `bundled_artifacts`, `tools_referenced` | Review those paths. External URLs remain mutable |
| Derived tool surface identity | Panel `subject_identity` and content digest | Panel-only. Do not copy this into native label schemas without a separate review |

Unknown evidence stays `undisclosed` or omitted per the label spec. Do not replace a
gap with a guessed `none`, a guessed rating, or a silent default.

## How to read a date

1. `generated.date` answers when this file was produced.
2. `version` (when present) answers which package or configuration was labeled.
3. AppFacts `--check` answers whether scanned repo inputs still match the fingerprint.
4. Nothing in the current native schemas answers "a named reviewer signed this on
   date D." Treat the absence as unknown review state, not as approved.

A schema-valid file can be stale the day after a release. Freshness is a separate
check from structure.

## Child-example coordination (2026-09-10)

Suite summaries must follow child owners, not the other way around.

- **ToolFacts / ForgeTrail `runAudit`:** returns a packaged audit prompt, does not
  scan the user workspace. Do not relabel it as a filesystem reader from hub copy.
- **ModelFacts qualitative ratings:** high / medium style fields are assessments.
  They are not objective facts unless a method and source are attached. Do not
  rewrite child rows from this document.

## Compatible proposals (not implemented)

These would be additive optional fields. They need a compatibility review before
any generator or validator requires them. Existing files stay valid without them.

### A. AppFacts `version` (optional string)

Application or package version the label describes. Today AppFacts has no product
version field, so freshness depends on `generated.date` and `inputs_fingerprint`.
Adding optional `version` would not break current files.

### B. Shared `reviewed` object (optional)

```yaml
reviewed:
  date: 2026-09-10
  by: "name or org"
  status: publisher-authored | independently-reviewed | stale
```

Compatibility: optional object, closed `status` enum. Files without it remain
publisher-authored by default. Do not treat presence as certification.

### C. AgentFacts `undisclosed` on `reach.filesystem` and `reach.network`

Those enums currently omit `undisclosed`. Host-unknown reach is forced into `none`
or another concrete value. Adding `undisclosed` is a compatible enum extension
only if validators accept the new member without rejecting older files.

### D. SkillFacts package digest (optional)

A digest over a defined set of packaged files (`SKILL.md` plus `bundled_artifacts`
paths). Must define canonicalization, path order, and exclusion of mutable remote
URLs. This is not a substitute for listing artifacts. Do not add the field until
those rules exist.

### E. AgentFacts configuration digest (optional)

A digest over the labeled configuration document, not the agent binary. Needs the
same canonicalization review as D.

## Non-goals

- No new label family, registry, or certificate authority.
- No silent family-wide migration.
- No requirement that every publisher fill review fields.
