# xFacts — utility, timing, and network effects

> A hard look at whether this suite is “obvious once seen” infrastructure at the
> right historical moment, what could make that true, and what we might be
> missing. Not an implementation plan. Companion to Catalyst Forge’s standing
> vision (`catalyst-forge/docs/xfacts-suite-vision.md`) and the 2026-08 flesh-out
> / portable-viewer work.

**Status:** strategic analysis (living).  
**Audience:** Catalyst Forge stewards, and any agent or human deciding whether to
bet attention on adoption.  
**Date:** 2026-08-07.

---

## 1. The one-line bet

**Trust at the moment of adoption is underserved across the AI stack, and the
reader of that trust signal is increasingly a machine.**

xFacts is a family of small, objective, validatable “nutrition labels” — one per
layer (app, model, tool, agent, skill) — that compose into a full panel. Specs
are CC0. Tooling is MIT. The format is Markdown + YAML frontmatter that humans
skim and agents parse.

If that bet is right, this is not a content site. It is a **coordination
standard** that can ride agent discovery the way SPDX rode SBOM tooling.

---

## 2. The gap (why it feels obvious after you see it)

Before AI agents, “what is this software?” was messy but bounded: README, LICENSE,
SBOM, package manifests, security advisories. After agents, the stack gained
layers that **look like documentation but behave like power**:

| Layer | Decision moment | Pre-xFacts answer |
|---|---|---|
| App | clone / buy / integrate | README tech stacks, SBOMs (noisy), marketing sites |
| Model | pick a brain | model cards (uneven), HF prose, vendor blogs, rumor |
| Tool (MCP) | attach a server | optional untrusted annotations; almost nobody sets them |
| Agent | let it run | product pages; config scattered; no comparable leash label |
| Skill | install a playbook | marketplace blurbs; skill text is the supply chain |

Nothing incumbent answers **the same shape of question** at each layer:

> In under a minute, what are the **objective** facts that change whether I (or
> my harness) should trust this *right now*?

That is the gap. It is not “more documentation.” It is **decision-shaped
facts** with closed enums, `undisclosed` as a first-class value, and a file that
can be validated, diffed, and eventually fed into policy.

Once named, the absence is loud — the same way “nutrition facts on food” or
“SBOM for dependencies” feel inevitable after they exist.

---

## 3. Why *now* (timing)

Several curves are intersecting in 2025–2026:

1. **MCP and tool ecosystems exploded** without a trust vocabulary. Annotations
   exist and are explicitly untrusted. That is a vacuum with daily install volume.
2. **Agent skills / playbooks** became installable supply chain (plain English
   that can imply shell and network). Marketplaces are maturing faster than
   review culture.
3. **Agents are first-class consumers of the web.** `llms.txt`, schema URLs,
   JSON catalogs, and hash payloads are not novelties; they are how capable
   agents prefer to learn.
4. **Compliance pressure is rising** (ISO 42001, EU AI Act transparency themes)
   without a lightweight, open evidence artifact for the *agentic* stack. SBOM
   covers packages; it does not cover “this agent may self-loop with open-world
   fetch.”
5. **CC0 + small files** match how standards actually spread in developer
   culture: copy a file into the repo, CI checks it, badges link out.

This is not “we invented trust.” It is “the stack grew a new trust surface
faster than formats did.” Being early with a crisp vocabulary matters more than
being perfect.

**Is it “amazing tool suite at the right time in history”?**  
Partially yes — *if* the suite becomes **emitted and consumed by default**, not
merely published as nice sites. Timing favors the *idea*. History only remembers
the *plumbing*.

---

## 4. Utility by audience

### Humans

- Skim a nutrition face (or portable `/v` card) before attaching power.
- Compare products with the same enums instead of vibes.
- Use `undisclosed` as a social signal (“they will not say what leaves the
  machine”).

### Agents and harnesses (the load-bearing audience)

- Fetch `llms.txt` → schema → exemplar or catalog JSON → decide.
- ToolFacts → mechanical approval policy (read/idempotent vs write vs destructive).
- AgentFacts → blast-radius gate before unclipping.
- SkillFacts → install-time reach check before teaching the agent new behavior.
- Composition: follow `toolsets` / `models` links to deepen without scraping HTML.

### Catalyst Forge / stewards

- Inbound surface that matches brand (“honest guidance, no hype”).
- Enterprise path later: drift detection / evidence automation (vision doc), not
  sponsored facts.
- Escape hatch: CC0 means a foundation can absorb the standard without a fight.

---

## 5. Network effects (where the leverage actually is)

Classic two-sided dynamics:

| Side A | Side B | Flywheel |
|---|---|---|
| Publishers (apps, model labs, MCP authors, agent vendors, skill authors) | Consumers (humans, agents, harnesses, security/review) | More labels → more useful directories/policy → more reason to publish |
| Generators / CI | Repos | Emit-on-save makes labels free; unlabeled starts to look odd |
| Harnesses that *require* or prefer labels | Tool/agent ecosystems | Attachment becomes gated on facts → authors fill the file |

**Agent discovery is the accelerant.** Humans adopt standards slowly. Agents that
are taught “check ToolFacts before attaching MCP” create demand overnight — if
those agents are widely used. That is why `llms.txt`, stable schema `$id`s,
exemplar indexes, and portable fragments matter more than marketing copy.

**Composition is a second flywheel.** A full panel (App + Model + Tool + Agent +
Skill) is a stronger story than any single label. Each new composed product is
advertising for the others.

**`undisclosed` is a third flywheel.** Directories that sort or filter on silence
punish opacity without moralizing. That only works if coverage is wide enough
that blank cells mean something.

---

## 6. What would make adoption “very quick”

Ordered by leverage, not comfort:

1. **One harness integrates ToolFacts into approval policy** (Cursor, Claude
   Desktop, a popular MCP host, an open agent runtime). Label becomes
   load-bearing.
2. **Generators that emit from reality** (MCP `tools/list`, skill parse, HF/Ollama
   cards) so authors do not hand-write forever.
3. **Public directories that are useful on day one** (ModelFacts already points
   this way; Tool/Agent need crawl+seed).
4. **Agent-default discovery:** hub + each label’s `llms.txt` linked from
   AGENTS.md templates, ForgeKit, and popular agent bootstraps.
5. **Dogfood in public:** Catalyst Forge / ForgeKit ship full panels; every demo
   ends on a `/v` card.
6. **CI cultural norm:** `--check` / schema validate in greenfield templates.

Without (1) or (2), the suite can still be “right” and still move slowly — a
beautiful format waiting for an emitter and a consumer.

---

## 7. What you might be missing (steelman the doubts)

### 7.1 Incumbents can absorb the niche

- MCP registry metadata could grow richer and eat ToolFacts’ job.
- Labs could ship official model cards that ignore ModelFacts.
- An Anthropic/OpenAI “agent manifest” could redefine AgentFacts’ vocabulary.

**Mitigation already in the DNA:** CC0, objective enums, verify-don’t-trust,
be first and useful. Absorption can still be a *win* if the vocabulary survives
inside something bigger — but Catalyst Forge would then own tooling/services, not
the standard’s center of gravity.

### 7.2 Self-reported facts without verification rot into trust theater

A wrong `side_effects: none` on a destructive tool is worse than no label.
Directories of self-authored claims without measurement invite greenwashing.

**Mitigation:** keep “certified” language out until harnesses measure; prefer
harsher enums; human-review before directory publish; eventual verification
service (vision doc) as the paid layer.

### 7.3 Configuration explosion (especially AgentFacts)

Every host tweak is not a new product. Label *shipped defaults* or the suite
drowns in nearly identical files.

### 7.4 Discovery is not automatic

`llms.txt` only helps agents that look. Most agents today do not. Without
deliberate seeding into agent bootstraps and host docs, “agents will find it”
is a hope, not a mechanism.

### 7.5 Five labels can look like sprawl

The admission rule exists because suite credibility depends on refusals
(DataFacts, PromptFacts). If we add labels for every noun, the family becomes
noise. Guard that reflex.

### 7.6 Portable hash viewers are for sharing, not for trusting

The `/v#…` card is a **shareable view** (link, QR, flip/copy). Fragments are
untrusted user-controlled data (trust banners exist for a reason). Git + schema
remain canonical. Do not treat a widely forwarded QR or hash link as proof that
the facts are true.

### 7.7 Cold-start of publishers

Network effects cut both ways: empty directories feel dead. ModelFacts-style seeding
and shared MCP crawl are not optional polish; they are adoption infrastructure.

### 7.8 Naming and attention

“xFacts” needs the variable framing every time. Legal risk is judged low; *mind*
risk (Twitter association) is real in first impressions. Hub copy already works
to preempt that — keep doing it.

---

## 8. What we are *not* missing (strengths that are easy to underrate)

- **Same skeleton everywhere** → five products cost closer to one to explain.
- **Golden Rule + `undisclosed`** → philosophical teeth, not just schema.
- **Composition story** → full panel is a category image competitors lack.
- **Dual audience in one file** → no separate “machine format” vs README rot.
- **No-backend portable cards** → demos and PRs can show a label without deploy
  drama.
- **Explicit non-goals** → refusing PromptFacts/DataFacts preserves seriousness.
- **Moment of adoption focus** → aligns with how people actually take risk
  (attach tool, install skill, unclip agent), not abstract “AI ethics” essays.

---

## 9. Strategic verdict

| Question | Answer |
|---|---|
| Is there a real gap? | **Yes.** Agentic stack trust is underspecified relative to install volume. |
| Is the suite well-shaped for that gap? | **Yes.** Layered labels, objective enums, composition, CC0. |
| Is timing unusually good? | **Yes, for Tool/Agent/Skill especially** (MCP + skills wave). Models and apps are crowded but still inconsistent. |
| Will it be adopted “very quickly” by default? | **Not by default.** Quickly *if* a harness and generators make it load-bearing. |
| Are the network effects enormous? | **Latent and real** — but they unlock only after emitters + consumers close the loop. |
| Are you missing a secret flaw? | The secret flaw is **trust theater + cold start**, not “the idea is wrong.” |
| Is this “amazing at the right time in history”? | It is a **correctly timed coordination bet**. History will call it amazing only if it becomes plumbing. |

**Bottom line:** You are not crazy. The gap is real and the shape is right. The
risk is not misunderstanding the opportunity — it is underestimating how much
**integration work** (generators, one host policy consumer, seeded directories,
agent bootstrap pointers) stands between “obvious idea” and “default
infrastructure.”

---

## 10. Implications (what to prioritize if we believe this)

1. **Make ToolFacts load-bearing first** — policy demo in a real harness beats
   another landing page.
2. **Ship emitters** — MCP introspection, skill parse, model card ingest.
3. **Seed directories** — especially tools/agents; ModelFacts pattern already
   teaches this.
4. **Weaponize agent discovery deliberately** — ForgeKit, AGENTS.md templates,
   hub `llms.txt`, “how agents should consume xFacts” one-pager that hosts can
   paste.
5. **Dogfood full panels** everywhere CF ships agents.
6. **Stay boring on certification** until measurement exists.
7. **Keep refusing** labels that fail the admission rule.

---

## 11. Open questions worth sitting with

1. Who is the *first* harness partner that benefits enough to gate on ToolFacts?
2. Should unlabeled MCP servers be treated as `undisclosed` worst-case by
   default in CF tooling (opinionated), or only when a label exists (polite)?
3. Is the enterprise wedge “drift detection” (vision) or “policy pack for MCP
   hosts” sooner?
4. How much of adoption should be **social** (directories, shame of
   `undisclosed`) vs **mechanical** (harness refuses attachment)?
5. If a lab or host adopts the vocabulary but not the domains, is that success?
   (Probably yes — plan for it emotionally and strategically.)

---

## 12. Relation to other suite docs

| Doc | Role |
|---|---|
| `catalyst-forge/docs/xfacts-suite-vision.md` | Standing product/strategy canon |
| `SUITE-FLESH-OUT-2026-08.md` | What was built in the flesh-out pass |
| `PORTABLE-VIEWER-AND-FLIP.md` | Share/skim surface for humans |
| [`ROADMAPS.md`](./ROADMAPS.md) | Suite sequencing + links to per-label roadmaps |
| Hub essay | [`/essay/coordination-bet/`](../site/essay/coordination-bet/index.html) — public prose version |
| **This file** | Utility, timing, network effects, doubts, verdict |

---

## License

Documentation for the open suite. Not a promise of adoption — a map of where
adoption would actually come from.
