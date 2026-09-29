# npm names for the xFacts families

**Status:** Draft. `@xfacts/panel@0.1.1`, `@xfacts/featurefacts@0.2.1`, and the five family `0.1.1` packages are on npm and run from `npx`. Family sites and READMEs name those commands. The live sites update when the operator redeploys. `@xfacts/appfacts@0.1.0` is prepared as ESM JavaScript and is not published.
**Date:** 2026-09-28
**Related:** ForgeTrail `specs/suite-cohesion-prelaunch-review.md` P1-6

## 1. Registry state on 2026-09-28

- None of these unscoped names is on npm: `xfacts`, `appfacts`, `featurefacts`, `toolfacts`, `skillfacts`, `modelfacts`, and the dashed forms (`app-facts` and the rest).
- `agentfacts@0.1.2` belongs to another account, `xr3less`. Its description is "See what your coding agent actually did, next to what it said it did." It is not part of AgentFacts.
- The npm search returns no packages under `@xfacts`. That does not show whether the org name is free. The registry refuses org listings to non-members, and the npmjs.com org page returned 403 to the check.
- On 2026-09-28 every xFacts `package.json` was `"private": true`. On 2026-09-29 the packages in section 3 dropped `private` and took the `@xfacts` names. `directory-tools` and the site roots stay private. Nothing is published.

## 2. Decision

Publish every xFacts package under one org scope, `@xfacts`. If npm will not create that org, use `@catalyst-forge` with the same package names.

Do not reserve the unscoped family names. xFacts docs, sites, and labels never tell anyone to install an unscoped name. Without reservations, another account can take any of them, as happened with `agentfacts`. Section 5 covers what the sites say about that.

## 3. Package map

A family's validator is the package people install first, so it takes the family name. Other tools in the family keep a suffix.

| Repository path | Current name | Proposed name | Command | Notes |
| --- | --- | --- | --- | --- |
| `x-facts/` | `@xfacts/panel` | `@xfacts/panel` | `xfacts-panel` | Subcommands: `panel`, `validate`, `integrity`, `drift`, `encode`, `badge`. |
| `feature-facts/` | `@xfacts/featurefacts` | `@xfacts/featurefacts` | `featurefacts` | Version 0.2.0. |
| `tool-facts/validator/` | `@xfacts/toolfacts` | `@xfacts/toolfacts` | `toolfacts` | Subcommands: `validate`, `encode-viewer`. |
| `agent-facts/validator/` | `@xfacts/agentfacts` | `@xfacts/agentfacts` | `agentfacts` | Same shape as ToolFacts. The command name matches the third-party package's name, but npm installs by package name, so they do not collide. |
| `skill-facts/validator/` | `@xfacts/skillfacts` | `@xfacts/skillfacts` | `skillfacts` | Same shape as ToolFacts. |
| `model-facts/validator/` | `@xfacts/modelfacts` | `@xfacts/modelfacts` | `modelfacts` | Subcommand: `validate`. |
| `model-facts/generator/` | `@xfacts/modelfacts-generator` | `@xfacts/modelfacts-generator` | `modelfacts-generate` | Drafts a label from a Hugging Face card or a local Ollama model. |
| `model-facts/directory-tools/` | `modelfacts-directory-tools` | not published | — | It maintains the modelfacts.dev catalog and has no users outside that repository. |
| `app-facts/generator/` | `@xfacts/appfacts` | `@xfacts/appfacts` | `appfacts` | ESM JavaScript, version 0.1.0, prepared on 2026-09-29 and not published. The Python generator stays in the repository and is not the npm command. The site still says clone until that publish. |
| `app-facts/`, `tool-facts/`, `agent-facts/`, `skill-facts/`, `model-facts/` roots | `<family>` or unnamed | stay private | — | Site and workspace roots only. |

## 4. Order of work

1. **Operator:** done on 2026-09-29. The org is `@xfacts`. `acmegeek` is the owner and the only member. The default team is `developers`, and new packages under the scope join that team. `@catalyst-forge` is not needed.
2. **Agent:** done on 2026-09-29, not published. Each package in the map (except `directory-tools` and AppFacts) has the `@xfacts` name, `bin`, `files`, `engines` `>=22.18.0`, `repository`, `license: MIT`, and `publishConfig.access: public`. `"private"` is removed. Commands import the TypeScript source. Validator and generator `prepack` copies the site schema (and the repo `LICENSE`) into the package directory; those copies are gitignored. `encode-viewer` still writes repo example indexes, so it is useful inside the repository. Checked: `pnpm test` in x-facts (22) and feature-facts (10); each validator against one example; `modelfacts-generate` with no target exits 2. `pnpm pack --dry-run` lists the command, source, schema or specs, README, and LICENSE, and does not list tests, `site/`, or `node_modules`. FeatureFacts `tsc` still fails on the existing `tests/helm-repos.test.ts` import of `scripts/helm-repos.mjs`; the test run itself passes.
3. **Operator:** done on 2026-09-29. `@xfacts/panel@0.1.1`, `@xfacts/featurefacts@0.2.1`, `@xfacts/toolfacts@0.1.1`, `@xfacts/agentfacts@0.1.1`, `@xfacts/skillfacts@0.1.1`, `@xfacts/modelfacts@0.1.1`, and `@xfacts/modelfacts-generator@0.1.1` are public. `npx` runs each command. The earlier `0.1.0` and `@xfacts/featurefacts@0.2.0` releases remain and cannot run from `node_modules`.
4. **Agent:** done on 2026-09-29 in the repositories, not yet redeployed. Family install sections and READMEs use `npx @xfacts/<name>`. The FeatureFacts “not on npm yet” line is gone. catalyst-forge `product-facts.js` sets `npm` to `@xfacts/panel` and lists the family commands; `pnpm versions` refreshed the shelf. ForgeTrail `content/companion-tools.json` does not name an install command, so that entry was left as it was. AppFacts was not in that pass.
5. **Operator:** redeploy the family site and catalystforge.com.
6. **Agent:** done on 2026-09-29, not published. The AppFacts Node generator is ESM. `app-facts/generator/package.json` names `@xfacts/appfacts` at 0.1.0 with bin `appfacts`, `engines` `>=22.18.0`, and `publishConfig.access: public`. The Python generator stays in the repository. Node tests (15) and Python tests (13) pass. A packed tarball installed under `node_modules` runs `--help` and writes a QR PNG. appfacts.dev still says clone until the operator publishes this package.

## 5. The third-party `agentfacts` package

Once `@xfacts/agentfacts` is published, the agentfacts.dev install section says: "Install `@xfacts/agentfacts`. The unscoped `agentfacts` package on npm is a separate project." The AgentFacts README says the same. Do not name or describe the other project beyond that.

That sentence is in the agentfacts.dev source and the AgentFacts README. It is on the live site after the operator redeploys.

## 6. Acceptance

- The org exists and is recorded in section 4.
- Each package in the map has the proposed name, and `pnpm pack --dry-run` lists only its intended files.
- `npx @xfacts/<name> --help` runs after each publish.
- No site, README, or label tells anyone to install an unscoped xFacts name.
- agentfacts.dev and the AgentFacts README carry the section 5 sentence.
