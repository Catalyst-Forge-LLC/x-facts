# Addendum II: Positioning, Scope, and Success

> **Superseded.** Positioning, success criteria, and non-goals now live in
> [`PANEL.md`](./PANEL.md) §§0, 10–13. Keep this file for history.

**Status:** Superseded by `PANEL.md`.
**Audience:** Maintainers, and anyone deciding what to build next.
**Purpose:** State what this project is for, and reweight the priorities in Addendum I accordingly. This document changes no normative requirement in the specification. It changes what counts as done.

---

## 1. What this project is

Two things, stated plainly so that scope decisions have something to appeal to:

1. **A free, permanently open tool** for seeing what an agent's tools can reach, and for detecting when that changes.
2. **A public demonstration of engineering judgment** by Catalyst Forge.

It is not a standards body. It is not a product. It is not a company. Any future paid service is an untested hypothesis (§7) and MUST NOT influence the design of the open project.

Both purposes point the same direction — rigor over reach — which is why they can be held together without conflict. When they appear to conflict, the open tool wins.

---

## 2. The core capability

The valuable thing is not the label. Transparency artifacts that depend on publishers filling out forms have a long history of going unread.

The valuable thing is **change detection over a derived tool surface**: knowing that an MCP server gained a shell-executing tool since it was approved, and being able to prove when. The Panel is the data structure that makes that possible; it is instrumental, not the point.

Two capabilities produce information nobody else currently has:

- **Drift** (Addendum I §2.3, Check B) — row-level diff of a re-derived Panel against a previously recorded one.
- **Conflicts** (Specification §9.2) — a publisher's claim checked against an observable endpoint. An Agent Card asserting no network access while its toolset demonstrably calls out is the discrepancy this project is uniquely positioned to surface.

Everything else in the suite is presentation of facts already available elsewhere. That is not worthless, but it is not what justifies the project.

---

## 3. Reweighted priorities

Addendum I's ordering stands. What changes is the weighting *within* it.

**Depth over breadth, without exception.** One profile with real canonicalization, honest identity confidence, a published severity table, and a checked-in test suite is worth more — for both stated purposes — than five partially specified layers. A reader evaluating rigor reads one thing carefully; they do not audit a family.

**Correctness over coverage.** A profile that emits `undisclosed` on half its rows and is right about all of them is a success. A profile that guesses well is a failure that has not surfaced yet.

**Legibility of reasoning over volume of output.** Every judgment call — a severity assignment, a collapse rule, a refusal — should be findable and dated. See §6.

Concretely, this means the `model`, `app`, and `skill` layers stay unbuilt until the `tool` path has an external user. SBOM tooling has regulatory pull and vendor budgets; model cards have Hugging Face's distribution. Neither is displaced by a better rendering, and attempting it dilutes the one place this project has an edge.

---

## 4. Success criteria, restated

Addendum I §7 defines what "0.1 usable" means technically. Those criteria stand unchanged. This section defines what success means for the project as a whole, which is a different question.

**The project has succeeded if any of the following is true:**

- A team uses the drift check and it catches a real change they would otherwise have missed.
- The MCP specification, or a major host, adopts equivalent capability — with or without credit.
- A reader of the repository concludes that the people behind it think carefully, and that conclusion leads somewhere.

**The project has not failed merely because:**

- Adoption is in the single digits. The audience that matters for both stated purposes is small.
- Nobody uses the name. The suite branding is the most disposable part of this.
- An upstream project or platform absorbs the idea. See §8.

Adoption metrics are a poor instrument here and should not drive roadmap decisions. Resist the pull toward shipping more surface area to look more substantial.

---

## 5. Upstream relations

Specification §7 already makes upstream contact and non-endorsement normative. Under this positioning it becomes the highest-consequence requirement in the project, because reputation is the actual output.

Reinforced:

- Contact maintainers **before** shipping a profile for an actively maintained format, not after. Record the exchange.
- Where a domain name matches an existing project's term, unofficial status appears above the fold, without exception and without softening.
- If an upstream maintainer objects to a profile, withdraw it. Do not negotiate, do not wait, do not ship pending resolution.
- Never describe this project's output as a standard for something someone else standardized.

A dispute with the A2A or NANDA maintainers would cost more than every technical error in this repository combined. Treat that asymmetry as a design constraint.

---

## 6. What to publish alongside the code

For a credibility asset, the reasoning is the artifact. Code demonstrates competence; recorded judgment demonstrates judgment.

Publish and keep current:

- **The reframe writeup.** Why the project moved from defining five original formats to adapting existing ones, including the name collisions that forced it. A public account of changing your mind under evidence is a stronger credential than the code it produced.
- **The refusals.** The existing `Refused` list — DataFacts, PromptFacts — plus every subsequent decision not to build. Under the standards framing this read as premature branding. Under this framing it is the most useful thing on the site: a record of a boundary being held.
- **A decision log.** Dated entries for severity assignments, collapse rules, canonicalization choices, and layer deferrals. Short entries. The point is traceability, not prose.
- **Recorded consumer and upstream responses**, including non-responses (Addendum I §1.1).

Write these for a reader who is evaluating how you would handle their infrastructure, because that is who is reading.

---

## 7. Hosted service: hypothesis, not plan

A continuous, multi-subject, historical version of the drift check — watching many servers, retaining the timeline, alerting on severity-increasing change — is a plausible paid service. It is not being built.

If it is ever built, the useful shape is an **audit record** rather than an alerting product: a defensible account of what each agent could reach on a given date, with digests and identity confidence, and gaps marked as gaps. Alerting is how a tool gets used; a retained record is what a security reviewer or procurement questionnaire actually demands and what nobody can currently produce. Retention is the only part that is not reproducible after the fact.

**The validation question**, to be asked in the ordinary course of consulting work and nowhere else:

> Has anyone asked you what your agents can access — a customer questionnaire, an auditor, an incident review? What did you send them?

Consistent "yes, and we scrambled" is signal. Consistent "no one's asked" means the category is early and the answer is to keep it free. Do not build billing, do not design tiers, and do not hold anything back from the open project against a future service.

**License posture, to be stated publicly now rather than later:** the specification, schemas, profiles, validator, drift check, viewer, and badge are permanently open — CC0 for specs and schemas, MIT for tooling. Any hosted service would be additive. Announcing this before there are adopters costs nothing and removes a question that becomes expensive to answer later. Retroactively closing something people have built on is the fastest available way to destroy the asset this project exists to create.

---

## 8. Graceful outcomes

Absorption is not a risk under this positioning; it is a good ending. If the MCP specification grows structured egress and credential fields, or a major host ships built-in tool-surface monitoring, then the problem was real, the approach was right, and it arrived early. Both stated purposes are served.

Accordingly:

- `tool-facts` remains explicitly a stopgap and is deprecated rather than defended if MCP subsumes it (Specification §5.2).
- No profile should be architected to make replacement difficult.
- If a better-resourced implementation appears, linking to it is the correct response.

The failure mode to actually guard against is different: a repository of well-written specifications with no working profile, no external reader, and no recorded upstream contact. That outcome serves neither purpose, and it is reached by continuing to write documents instead of shipping `mcp-tools-list`.

---

## 9. Additional non-goals

Extending Addendum I §6:

- Do not add layers, labels, or domains to make the family look complete.
- Do not build features that only make sense for a service that does not exist.
- Do not optimize for adoption metrics.
- Do not defend the branding at the expense of the capability. If the suite naming has to go for the drift check to land somewhere useful, it goes.

---

## 10. The one-line test

Before building anything, ask:

> Does this help someone see what their agents can reach, or see that it changed?

If no, it is surface area. Surface area is the thing this project has already had to cut once.
