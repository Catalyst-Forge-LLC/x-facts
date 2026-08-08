# xFacts suite roadmaps — index

> Per-label improvement roadmaps derived from
> [`SUITE-VALUE-AND-NETWORK-EFFECTS.md`](./SUITE-VALUE-AND-NETWORK-EFFECTS.md).
> Each label repo owns its detailed roadmap; this file is the suite map and
> sequencing advice.

**Public essays (hub site):**

| Path | Audience | Hub-linked? |
|---|---|---|
| [`/essay/why-labels/`](../site/essay/why-labels/index.html) | Readers and publishers | Yes |
| [`/essay/coordination-bet/`](../site/essay/coordination-bet/index.html) | People helping adopt, integrate, maintain, broadcast, evangelize | No (`noindex`) |

Maintainer analysis stays in
[`SUITE-VALUE-AND-NETWORK-EFFECTS.md`](./SUITE-VALUE-AND-NETWORK-EFFECTS.md).

---

## Sequencing (if we believe the value doc)

| Priority | Focus | Why |
|---|---|---|
| P0 | **Deploy + discoverability** (all labels live; `llms.txt` real; [pointer contract](./DISCOVERY-AND-PUBLICATION.md) documented) | Cold start ends when URLs resolve and consumers know where to look |
| P1 | **ToolFacts emitter + policy demo** (generator prints canonical + viewer URLs; demo fetches by URL) | First load-bearing consumer unlocks the flywheel |
| P2 | **ModelFacts push + directory live** | Public proof + agent catalog pattern |
| P3 | **AgentFacts rolls up ToolFacts** | Composition story becomes real |
| P4 | **SkillFacts generator** | Skills wave; reuse tool heuristics |
| P5 | **AppFacts as default emit habit** | Templates and CI ship labels; badges spread the mark |
| Ongoing | Refuse new labels that fail admission; no “certified” without measurement |

---

## Per-label roadmap specs

| Label | Roadmap |
|---|---|
| AppFacts | [`app-facts/specs/IMPROVEMENT-ROADMAP.md`](../../app-facts/specs/IMPROVEMENT-ROADMAP.md) |
| ModelFacts | [`model-facts/specs/IMPROVEMENT-ROADMAP.md`](../../model-facts/specs/IMPROVEMENT-ROADMAP.md) |
| ToolFacts | [`tool-facts/specs/IMPROVEMENT-ROADMAP.md`](../../tool-facts/specs/IMPROVEMENT-ROADMAP.md) |
| AgentFacts | [`agent-facts/specs/IMPROVEMENT-ROADMAP.md`](../../agent-facts/specs/IMPROVEMENT-ROADMAP.md) |
| SkillFacts | [`skill-facts/specs/IMPROVEMENT-ROADMAP.md`](../../skill-facts/specs/IMPROVEMENT-ROADMAP.md) |

---

## Shared work (not owned by one label)

- **Discovery / publication contract:** [`DISCOVERY-AND-PUBLICATION.md`](./DISCOVERY-AND-PUBLICATION.md) (canonical URL + host pointer + optional `/v`; URL-preferred cross-refs).
- Hub essay + thin `llms.txt` (done / iterate).
- ForgeKit / AGENTS.md bootstrap pointers to family `llms.txt`.
- Dogfood **full panels** on CF products (each demo ends with a fetchable label URL).
- Shared MCP crawl feeding ToolFacts + AgentFacts directories.
- Emotional success criterion: vocabulary adoption even if domains are not.

---

## License

Documentation for the open suite.
