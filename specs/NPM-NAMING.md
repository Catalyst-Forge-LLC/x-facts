# npm names for the xFacts families

**Status:** Draft. `@xfacts/panel@0.1.0`, `@xfacts/featurefacts@0.2.0`, and the five `0.1.0` family packages are on npm. Those versions import TypeScript from `node_modules`, which Node refuses to run. `0.1.1` and `@xfacts/featurefacts@0.2.1` bundle the commands to JavaScript and are not published yet.
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
| `app-facts/generator/` | none | `@xfacts/appfacts` later | `appfacts` | This is plain JavaScript and Python with no `package.json`. It needs a TypeScript ESM package before it can be named. Until then AppFacts stays clone-only. |
| `app-facts/`, `tool-facts/`, `agent-facts/`, `skill-facts/`, `model-facts/` roots | `<family>` or unnamed | stay private | — | Site and workspace roots only. |

## 4. Order of work

1. **Operator:** done on 2026-09-29. The org is `@xfacts`. `acmegeek` is the owner and the only member. The default team is `developers`, and new packages under the scope join that team. `@catalyst-forge` is not needed.
2. **Agent:** done on 2026-09-29, not published. Each package in the map (except `directory-tools` and AppFacts) has the `@xfacts` name, `bin`, `files`, `engines` `>=22.18.0`, `repository`, `license: MIT`, and `publishConfig.access: public`. `"private"` is removed. Commands import the TypeScript source. Validator and generator `prepack` copies the site schema (and the repo `LICENSE`) into the package directory; those copies are gitignored. `encode-viewer` still writes repo example indexes, so it is useful inside the repository. Checked: `pnpm test` in x-facts (22) and feature-facts (10); each validator against one example; `modelfacts-generate` with no target exits 2. `pnpm pack --dry-run` lists the command, source, schema or specs, README, and LICENSE, and does not list tests, `site/`, or `node_modules`. FeatureFacts `tsc` still fails on the existing `tests/helm-repos.test.ts` import of `scripts/helm-repos.mjs`; the test run itself passes.
3. **Operator:** `@xfacts/panel@0.1.0`, `@xfacts/featurefacts@0.2.0`, `@xfacts/toolfacts@0.1.0`, `@xfacts/agentfacts@0.1.0`, `@xfacts/skillfacts@0.1.0`, `@xfacts/modelfacts@0.1.0`, and `@xfacts/modelfacts-generator@0.1.0` were published on 2026-09-29. `npx` fails with `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`. Publish `0.1.1` and `@xfacts/featurefacts@0.2.1`, which bundle each command to JavaScript during `prepack`.
4. **Agent, after each publish:** change the site's install section from `git clone` to `npx @xfacts/<name>`. Remove the FeatureFacts line saying the CLI "is not on npm yet". Update catalyst-forge `src/lib/product-facts.js` npm fields and run `pnpm versions`. Update the ForgeTrail `content/companion-tools.json` xFacts entry if it names an install command.
5. **Operator:** redeploy the family site and catalystforge.com.

## 5. The third-party `agentfacts` package

Once `@xfacts/agentfacts` is published, the agentfacts.dev install section says: "Install `@xfacts/agentfacts`. The unscoped `agentfacts` package on npm is a separate project." The AgentFacts README says the same. Do not name or describe the other project beyond that.

Until then, the install section already uses `git clone`, so no npm name appears. The sentence can go in sooner if the promotion goes out before the publish.

## 6. Acceptance

- The org exists and is recorded in section 4.
- Each package in the map has the proposed name, and `pnpm pack --dry-run` lists only its intended files.
- `npx @xfacts/<name> --help` runs after each publish.
- No site, README, or label tells anyone to install an unscoped xFacts name.
- agentfacts.dev and the AgentFacts README carry the section 5 sentence.
