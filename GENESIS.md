# GENESIS — xFacts Hub

> Bootstrap spec for a build session. This repo is different from its siblings:
> **no spec, no schema, no generator.** It is one static page and the family's
> shared footer standard. Read the suite vision first:
> `catalyst-forge/docs/xfacts-suite-vision.md` (internal; do not
> publish its strategy sections).

## What this is

The front door of the xFacts family at **xfacts.dev** (domain owned, registered
2026-07-31). One page that explains the suite in under a minute and routes to the
five label sites. The per-label domains stay canonical for specs and schemas; this
site owns the story.

Sibling repos: `app-facts`, `model-facts`, `tool-facts`, `agent-facts`,
plus skillfacts.dev reserved for later. GitHub org `Catalyst-Forge-LLC`,
repo `x-facts` (owner creates and pushes).

## The name, stated on the first screen

**x is a variable, not a social network.** The suite is `facts(x)`: one small,
validatable nutrition label per value of x. Lead with this framing; it's the
honest origin of the name and it preempts the X/Twitter misreading before anyone
makes it. Styling rule, everywhere and always: **xFacts**, lowercase x, never
"XFacts" or "X Facts".

## Page content (in order)

1. **First screen:** the name, the variable line, and the one-sentence vision — a
   family of small, validatable nutrition labels, one per layer of the AI stack,
   that make software legible at the moment someone decides whether to trust it.
2. **The anatomy:** the five labels as a table or label-styled cards.

   | Label | Layer | Answers |
   |---|---|---|
   | AppFacts | Body | What is this app built from? |
   | ModelFacts | Brain | What went into this model? |
   | ToolFacts | Toolbelt | What does this instrument touch when invoked? |
   | AgentFacts | Hands | What may this actor do, and on what leash? |
   | SkillFacts | Playbook | What will this teach my agent to do? (reserved) |

   Each links out to its site; unshipped labels say so plainly ("spec in
   progress", "reserved"). Honesty about status is on-brand; fake completeness is
   not.
3. **The shared rules, briefly:** the Golden Rule (objective facts only),
   `undisclosed` over omission, closed enums, CC0 specs and MIT tooling.
4. **The full panel:** a serious AI product can ship `APP_FACTS.md`,
   `MODEL_FACTS.md`, `TOOL_FACTS.md`, and `AGENT_FACTS.md` side by side and be
   more transparent than any incumbent. Show the four files as one visual.
5. **The admission rule, stated publicly:** a new label earns a domain only if
   someone adopts the thing and needs trust at that moment, the facts are
   objective and machine-derivable, and no incumbent format answers the question.
   Note what was refused (dataset labels: ground already covered; prompt labels:
   mostly judgment). Saying no in public is part of the brand.
6. **Footer:** the canonical family footer (below).

## The family footer (this repo owns it)

This repo defines the canonical footer markup that every sibling site copies: the
five labels plus the hub, current site unlinked, xfacts.dev as the home link, and
a "by Catalyst Forge" credit linking to catalystforge.com. Ship it as a small
`footer.html` snippet + CSS in `site/` that siblings paste in at their next
deploy. When the family grows or a label ships, this file changes first and the
siblings follow.

## Design

- AppFacts design system, same dark background family as the siblings.
- The hub itself is accent-neutral; each label appears in its own accent
  (ModelFacts violet `#7c5cf0`, AgentFacts leaning amber, ToolFacts leaning
  teal/green, AppFacts' own, SkillFacts TBD). The five colored marks on one dark
  page *is* the family portrait.
- No em dashes, no AI-smell vocabulary. Match the family register.

## Repo layout

```
x-facts/
  GENESIS.md          (this file)
  README.md           short: what the hub is, pointer to the label repos
  NOTES.md            maintainer/agent state snapshot, kept current
  site/               static, Cloudflare Pages root=site, no build step
    index.html
    footer.html       canonical family footer snippet + styles
```

Workspace conventions: **pnpm + TypeScript + ESM only** if any tooling appears
(none is planned). Commit after substantive work. **Never push without the
owner's explicit ask.**

## Milestones

1. `site/index.html` complete per the content order above.
2. `footer.html` canonical snippet; siblings adopt at their next deploy.
3. Cloudflare Pages project + DNS for xfacts.dev.
4. Update the Catalyst Forge announcement post's "everything is open" link from
   the GitHub org to xfacts.dev at launch.

## Acceptance criteria

- A stranger landing on xfacts.dev understands the suite and finds the right
  label site in under a minute.
- The X/Twitter misreading is defused on the first screen without being defensive
  about it.
- Every claim on the page is true on the day it deploys: shipped labels link to
  live sites, unshipped ones say their real status.

## Open decisions

1. Hub tagline. Candidates: "facts(x) — one label per layer." / "Read the label.
   Every layer has one." / "x is a variable."
2. Whether the hub hosts a combined news/changelog for the family or stays
   changeless between label launches. Recommendation: stay changeless; launches
   are announced on the Catalyst Forge blog.
