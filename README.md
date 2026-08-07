# xFacts

**x is a variable, not a social network.**

The front door of the xFacts family at [xfacts.dev](https://xfacts.dev): a family of small, validatable nutrition labels, one per layer of the AI stack, that make software legible at the moment someone decides whether to trust it.

This repo is the hub only. No per-label spec, schema, or generator. It owns the story page, the canonical family footer, and a thin agent pointer (`site/llms.txt`) to the five label domains.

| Label | Layer | Site | Status |
|---|---|---|---|
| [AppFacts](https://appfacts.dev) | Body | appfacts.dev | Live |
| ModelFacts | Brain | modelfacts.dev | Built, not live yet |
| ToolFacts | Toolbelt | toolfacts.dev | Ready for first deploy |
| AgentFacts | Hands | agentfacts.dev | Ready for first deploy |
| SkillFacts | Playbook | skillfacts.dev | Ready for first deploy |

## What's in here

```
site/
  index.html     Hub landing page (Cloudflare Pages root)
  footer.html    Canonical family footer snippet + styles
  llms.txt       Thin family pointer for agents
  essay/coordination-bet/   Public essay (keeps the home page light)
specs/
  SUITE-FLESH-OUT-2026-08.md   Session task / phases / findings
  HUB-UPDATES.md               Hub change plan for this session
  PORTABLE-VIEWER-AND-FLIP.md  Suite plan: /v viewers + flip-to-raw (not ModelFacts)
  SUITE-VALUE-AND-NETWORK-EFFECTS.md  Utility, timing, network effects, hard doubts
  ROADMAPS.md                  Index of per-label improvement roadmaps
```

Static site, no build step. Point Cloudflare Pages at `site/`.

## Family footer

`site/footer.html` is the paste-ready footer for every sibling. When the family grows or a label ships, change that file first; the label sites follow at their next deploy.

## Naming

Always **xFacts**, lowercase x. Never "XFacts" or "X Facts".

## License

The hub page is documentation for an open suite. Specs and schemas in the label repos are CC0; tooling there is MIT.

Maintained by [Catalyst Forge](https://www.catalystforge.com/).
