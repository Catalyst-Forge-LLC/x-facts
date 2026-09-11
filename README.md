# xFacts

**x is a variable, not a social network.**

The front door of the xFacts family at [xfacts.dev](https://xfacts.dev): a family of small, validatable nutrition labels, one per layer of the AI stack, that make software legible at the moment someone decides whether to trust it.

This repo is the hub and the home of the **Panel** contract ([`specs/PANEL.md`](./specs/PANEL.md)): a derived, machine-readable view of what tools can reach, plus drift detection. Per-label formats still live in the five sibling repos; they are transitional natives.

| Label | Layer | Site | Status |
|---|---|---|---|
| [AppFacts](https://appfacts.dev) | Body | appfacts.dev | Live |
| [ModelFacts](https://modelfacts.dev) | Brain | modelfacts.dev | Live |
| [ToolFacts](https://toolfacts.dev) | Toolbelt | toolfacts.dev | Live |
| [AgentFacts](https://agentfacts.dev) | Hands | agentfacts.dev | Live |
| [SkillFacts](https://skillfacts.dev) | Playbook | skillfacts.dev | Live |

## What's in here

```
site/
  index.html     Hub landing page (Cloudflare Pages root)
  footer.html    Canonical family footer snippet + styles
  llms.txt       Thin family pointer for agents
  essay/why-labels/           Consumer essay (linked from hub)
  essay/coordination-bet/   Helpers essay: adopt / integrate / evangelize (not hub-linked)
specs/
  SUITE-FLESH-OUT-2026-08.md   Session task / phases / findings
  HUB-UPDATES.md               Hub change plan for this session
  PORTABLE-VIEWER-AND-FLIP.md  Suite plan: /v viewers + flip-to-raw (not ModelFacts)
  SUITE-VALUE-AND-NETWORK-EFFECTS.md  Utility, timing, network effects, hard doubts
  DISCOVERY-AND-PUBLICATION.md Pointer contract (canonical URL + host surface + /v)
  PANEL.md                     Master Panel spec (derived views + drift)
  panel.schema.json            Panel schema (tool layer)
  enums.json                   Tool row keys
  profiles/mcp-tools-list/     First profile
  PANEL-DECISIONS.md           Dated decision log for the Panel work
  ROADMAPS.md                  Suite sequencing
src/                           Panel CLI and tests
reviews/                       Consumer and upstream replies
```

Static site for [xfacts.dev](https://xfacts.dev) lives in [`site/`](./site/). Publish with `pnpm ship` (Wrangler Worker `x-facts`, uploads `site/` as static assets, no build step).

## Panel

Derived tool-surface view. Live `tools/list` in, JSON Panel out. No guessing: missing facts are `undisclosed`.

```bash
pnpm install
pnpm test
pnpm panel --source specs/profiles/mcp-tools-list/test-vectors/annotated.source.json \
  --name "Annotated MCP" --out panel.json
pnpm validate panel.json
pnpm integrity panel.json --source specs/profiles/mcp-tools-list/test-vectors/annotated.source.json
pnpm drift panel.json --source specs/profiles/mcp-tools-list/test-vectors/annotated.source.json
pnpm encode panel.json          # https://xfacts.dev/v#pn1.…
pnpm badge panel.json --out badge.svg
pnpm panel --stdio -- node ../forgetrail/mcp-server/dist/index.js
```

| Path | Role |
|---|---|
| `specs/panel.schema.json` | Panel JSON Schema |
| `specs/enums.json` | `tool` row keys only |
| `specs/profiles/mcp-tools-list/` | First profile |
| `src/` | Fetch, map, validate, integrity, drift |
| `site/v/` | Portable viewer (`pn1.` fragment) |
| `reviews/` | Consumer / upstream replies |

Exit codes: `0` ok · `1` schema · `2` usage · `3` integrity · `4` severity-increasing drift · `5` other row drift.

Native `tool-facts` profile is next (stopgap). Badge and viewer already distinguish native vs adapted.

## LocalHelm plugin

Enroll this checkout in a LocalHelm fleet to get an **xFacts labels** board on the Sites tab (`localhelm.plugin.mjs`).

```bash
localhelm enroll ../x-facts --apply
localhelm plugins
localhelm plugin xfacts                 # board
localhelm plugin xfacts check           # plan fingerprint checks
localhelm plugin xfacts reencode --apply
localhelm plugin xfacts refresh --apply # regenerates AppFacts via sibling generator
localhelm plugin xfacts ship x-facts --apply
```

The bridge (`scripts/localhelm-bridge.mjs`) lists the enrolled LocalHelm fleet (or sibling git folders if there is no fleet file) and reports app, tool, skill, agent, and model labels (any `*_FACTS.md` under the repo, skipping `node_modules` / `.git` / `dist` / `site` / fixtures), `/v` drift, and plan/apply for check · re-encode · refresh · ship. Refresh writes `APP_FACTS.md` via the AppFacts generator and any missing `SKILL_FACTS.md` next to `SKILL.md` packs. It does not invent ToolFacts, AgentFacts, or ModelFacts. Re-encode writes a `/v` card into each `*_FACTS.md` from frontmatter. Ship runs `pnpm ship` when that script exists (wrangler / Pages), not FilePress Land.

## Family footer

`site/footer.html` is the paste-ready footer for every sibling. When the family grows or a label ships, change that file first; the label sites follow at their next deploy.

## Naming

Always **xFacts**, lowercase x. Never "XFacts" or "X Facts".

## License

The hub page is documentation for an open suite. Specs and schemas in the label repos are CC0; tooling there is MIT.

Maintained by [Catalyst Forge](https://www.catalystforge.com/).
