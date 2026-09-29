# npm names for the xFacts families

**Status:** Draft. The `@xfacts` org exists. Nothing is renamed or published yet.
**Date:** 2026-09-28
**Related:** ForgeTrail `specs/suite-cohesion-prelaunch-review.md` P1-6

## 1. Registry state on 2026-09-28

- None of these unscoped names is on npm: `xfacts`, `appfacts`, `featurefacts`, `toolfacts`, `skillfacts`, `modelfacts`, and the dashed forms (`app-facts` and the rest).
- `agentfacts@0.1.2` belongs to another account, `xr3less`. Its description is "See what your coding agent actually did, next to what it said it did." It is not part of AgentFacts.
- The npm search returns no packages under `@xfacts`. That does not show whether the org name is free. The registry refuses org listings to non-members, and the npmjs.com org page returned 403 to the check.
- Every xFacts `package.json` is `"private": true`.

## 2. Decision

Publish every xFacts package under one org scope, `@xfacts`. If npm will not create that org, use `@catalyst-forge` with the same package names.

Do not reserve the unscoped family names. xFacts docs, sites, and labels never tell anyone to install an unscoped name. Without reservations, another account can take any of them, as happened with `agentfacts`. Section 5 covers what the sites say about that.

## 3. Package map

A family's validator is the package people install first, so it takes the family name. Other tools in the family keep a suffix.

| Repository path | Current name | Proposed name | Command | Notes |
| --- | --- | --- | --- | --- |
| `x-facts/` | `xfacts` | `@xfacts/panel` | `xfacts-panel` | The scripts `panel`, `validate`, `integrity`, `drift`, `encode`, and `badge` become subcommands. It has no `bin` yet. |
| `feature-facts/` | `featurefacts` | `@xfacts/featurefacts` | `featurefacts` | The `bin` already exists. |
| `tool-facts/validator/` | `toolfacts-validator` | `@xfacts/toolfacts` | `toolfacts` | `validate` and `encode-viewer` become subcommands. |
| `agent-facts/validator/` | `agentfacts-validator` | `@xfacts/agentfacts` | `agentfacts` | Same shape as ToolFacts. The command name matches the third-party package's name, but npm installs by package name, so they do not collide. |
| `skill-facts/validator/` | `skillfacts-validator` | `@xfacts/skillfacts` | `skillfacts` | Same shape as ToolFacts. |
| `model-facts/validator/` | `modelfacts-validator` | `@xfacts/modelfacts` | `modelfacts` | Same shape as ToolFacts. |
| `model-facts/generator/` | `modelfacts-generator` | `@xfacts/modelfacts-generator` | `modelfacts-generate` | Drafts a label from a Hugging Face card or a local Ollama model. |
| `model-facts/directory-tools/` | `modelfacts-directory-tools` | not published | — | It maintains the modelfacts.dev catalog and has no users outside that repository. |
| `app-facts/generator/` | none | `@xfacts/appfacts` later | `appfacts` | This is plain JavaScript and Python with no `package.json`. It needs a TypeScript ESM package before it can be named. Until then AppFacts stays clone-only. |
| `app-facts/`, `tool-facts/`, `agent-facts/`, `skill-facts/`, `model-facts/` roots | `<family>` or unnamed | stay private | — | Site and workspace roots only. |

## 4. Order of work

1. **Operator:** done on 2026-09-29. The org is `@xfacts`. `acmegeek` is the owner and the only member. The default team is `developers`, and new packages under the scope join that team. `@catalyst-forge` is not needed.
2. **Agent, one repository at a time:** rename the package, remove `"private": true`, add `bin`, `files`, `engines`, `repository`, and `publishConfig.access: public`, and move script entry points behind the command. `pnpm pack --dry-run` must list only the intended files, and the family's validator must still pass its examples. Do not publish.
3. **Operator:** publish each package.
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
