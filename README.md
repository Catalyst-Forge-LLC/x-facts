# xFacts

**x is a variable, not a social network.**

The front door of the xFacts family at [xfacts.dev](https://xfacts.dev): a family of small, validatable nutrition labels, one per layer of the AI stack, that make software legible at the moment someone decides whether to trust it.

This repo is the hub only. No spec, no schema, no generator. It owns the story page and the canonical family footer that sibling sites copy.

| Label | Layer | Site | Status |
|---|---|---|---|
| [AppFacts](https://appfacts.dev) | Body | appfacts.dev | Live |
| ModelFacts | Brain | modelfacts.dev | Built, not live yet |
| ToolFacts | Toolbelt | toolfacts.dev | Spec in progress |
| AgentFacts | Hands | agentfacts.dev | Spec in progress |
| SkillFacts | Playbook | skillfacts.dev | Reserved |

## What's in here

```
site/
  index.html     Hub landing page (Cloudflare Pages root)
  footer.html    Canonical family footer snippet + styles
```

Static site, no build step. Point Cloudflare Pages at `site/`.

## Family footer

`site/footer.html` is the paste-ready footer for every sibling. When the family grows or a label ships, change that file first; the label sites follow at their next deploy.

## Naming

Always **xFacts**, lowercase x. Never "XFacts" or "X Facts".

## License

The hub page is documentation for an open suite. Specs and schemas in the label repos are CC0; tooling there is MIT.

Maintained by [Catalyst Forge](https://www.catalystforge.com/).
