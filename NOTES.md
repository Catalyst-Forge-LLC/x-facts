# Project Notes · xFacts hub

> Working notes for maintainers/agents picking up this project. Not published to the site.
> Last updated: 2026-08-03 (initial hub build).

## What this is

The family front door at **xfacts.dev** (domain registered 2026-07-31). One static
page that explains the suite and routes to the five label sites. Also owns the
canonical family footer snippet siblings paste in.

Sibling repos (local): `app-facts`, `model-facts`, `tool-facts`,
`agent-facts`. Suite vision (internal): `catalyst-forge/docs/xfacts-suite-vision.md`.
Bootstrap spec: `GENESIS.md` in this repo.

## State as of 2026-08-03

| Piece | Where | Status |
|---|---|---|
| Hub landing | `site/index.html` | Done. Content order per GENESIS. Accent-neutral hub; each label in its own accent. |
| Family footer | `site/footer.html` | Done. Paste-ready markup + CSS; hub example + AppFacts sibling example in comments. |
| README | `README.md` | Done. Short family pointer. |
| Cloudflare Pages + DNS | (pending) | Not yet. Milestone 3 in GENESIS. |
| GitHub remote | (none) | None locally. Owner creates `Catalyst-Forge-LLC/x-facts` and pushes. |
| Sibling footer adoption | app-facts, model-facts, … | Pending their next deploys. |

No tooling planned. If any appears: pnpm + TypeScript + ESM only.

## Accents (family portrait)

| Label | Accent | Hex |
|---|---|---|
| AppFacts | Ember | `#d96b2b` |
| ModelFacts | Violet | `#7c5cf0` |
| ToolFacts | Teal | `#2dd4bf` |
| AgentFacts | Amber | `#f6ad55` |
| SkillFacts | Rose | `#f472b6` |

Hub itself stays accent-neutral (soft multi-hue wash, white brand).

## Design / voice rules

- Match AppFacts design system: Sora + IBM Plex Mono, dark background, grid hero.
- Brand always **xFacts** (lowercase x). First screen leads with "x is a variable, not a social network."
- No em dashes. No AI-smell vocabulary. Honest status for unshipped labels.
- Per-label domains stay canonical for specs/schemas; hub owns the story.

## Open decisions (from GENESIS)

1. Hub tagline still open. Page currently leads with the variable line + one-sentence vision rather than locking a short tagline.
2. Stay changeless between label launches; announce on the Catalyst Forge blog.

## Next steps

1. Owner: create GitHub repo, push when ready (do not push from agents without explicit ask).
2. Cloudflare Pages project, root = `site`, DNS for xfacts.dev.
3. At launch: point the Catalyst Forge announcement "everything is open" link at xfacts.dev.
4. Sibling sites: adopt `footer.html` on next deploy.
5. When ToolFacts / AgentFacts ship: update anatomy statuses + links on the hub first, then footer if needed.

## Commit / push policy

Commit after substantive work. **Never push without the owner's explicit ask.**
No remotes were added during the hub build session.
