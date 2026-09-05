# xFacts

**x is a variable, not a social network.**

The front door of the xFacts family at [xfacts.dev](https://xfacts.dev): a family of small, validatable nutrition labels, one per layer of the AI stack, that make software legible at the moment someone decides whether to trust it.

This repo is the hub and the home of the **Panel** contract ([`specs/PANEL.md`](./specs/PANEL.md)): a derived, machine-readable view of what tools can reach, plus drift detection. Per-label formats still live in the five sibling repos; they are transitional natives. The next implementation cycle (schema, `mcp-tools-list`, validator, viewer) lands here.

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
  PANEL.md                     Master Panel spec (derived views + drift; implement this)
  PANEL-DECISIONS.md           Dated decision log for the Panel work
  ROADMAPS.md                  Suite sequencing
```

Static site, no build step. Point Cloudflare Pages at `site/`.

## LocalHelm plugin

Enroll this checkout in a LocalHelm fleet to get an **xFacts labels** board on the Sites tab (`localhelm.plugin.mjs`).

```bash
localhelm enroll ../x-facts --apply
localhelm plugins
localhelm plugin xfacts                 # board
localhelm plugin xfacts check           # plan fingerprint checks
localhelm plugin xfacts reencode --apply
localhelm plugin xfacts refresh --apply # regenerates AppFacts via sibling generator
```

The bridge (`scripts/localhelm-bridge.mjs`) lists the enrolled LocalHelm fleet (or sibling git folders if there is no fleet file) and reports App/Tool/Skill presence, `/v` drift, and plan/apply for check · re-encode · refresh. Refresh creates `APP_FACTS.md` when a checked repo has none. Re-encode writes a `/v` card into each `APP_FACTS.md`, `TOOL_FACTS.md`, and `SKILL_FACTS.md` from frontmatter.

## Family footer

`site/footer.html` is the paste-ready footer for every sibling. When the family grows or a label ships, change that file first; the label sites follow at their next deploy.

## Naming

Always **xFacts**, lowercase x. Never "XFacts" or "X Facts".

## License

The hub page is documentation for an open suite. Specs and schemas in the label repos are CC0; tooling there is MIT.

Maintained by [Catalyst Forge](https://www.catalystforge.com/).
