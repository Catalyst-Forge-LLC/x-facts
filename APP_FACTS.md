---
app_facts_version: 0.1.0
name: panel
type: CLI tool
status: active
license: MIT
version: 0.1.2
repository: https://github.com/Catalyst-Forge-LLC/x-facts
stack:
  language: TypeScript
  runtime: Node.js
  tooling: pnpm
key_dependencies:
  - name: "@modelcontextprotocol/sdk"
    purpose: Declared in package.json.
    registry: npm
  - name: ajv
    purpose: Declared in package.json.
    registry: npm
  - name: ajv-formats
    purpose: Declared in package.json.
    registry: npm
  - name: canonicalize
    purpose: Declared in package.json.
    registry: npm
  - name: yaml
    purpose: Declared in package.json.
    registry: npm
build:
  package_manager: pnpm
  test: "tsx --test src/*.test.ts && node --test scripts/label-audit.test.mjs"
  compile: build script
  ci: "GitHub Actions (panel.yml)"
generated:
  date: 2026-09-29
  generator: "appfacts-cli v0.1.0 (scaffold)"
  inputs_fingerprint: df4614ddf1b20a64
credits:
  generated_with: https://appfacts.dev
  built_by: "Catalyst Forge — https://www.catalystforge.com/"
---

# panel

`CLI tool` · **active** · MIT

xFacts hub and Panel tooling: derived tool-surface views and drift checks.

**[Open visual label →][appfacts-label]** · or scan `APP_FACTS.png`

[Repository](https://github.com/Catalyst-Forge-LLC/x-facts)

### Stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript |
| Runtime | Node.js |
| Tooling | pnpm |

### Key dependencies

- `@modelcontextprotocol/sdk` (npm) — Declared in package.json.
- `ajv` (npm) — Declared in package.json.
- `ajv-formats` (npm) — Declared in package.json.
- `canonicalize` (npm) — Declared in package.json.
- `yaml` (npm) — Declared in package.json.

### Build

- **Package Manager** — pnpm
- **Test** — tsx --test src/*.test.ts && node --test scripts/label-audit.test.mjs
- **Compile** — build script
- **CI** — GitHub Actions (panel.yml)

---
*Generated with [AppFacts](https://appfacts.dev) · Built by [Catalyst Forge](https://www.catalystforge.com/) · [Visual label][appfacts-label]*

[appfacts-label]: https://appfacts.dev/v#af1.eNqdUk1vGyEQ_SvoHaKmYneVK6dGjtpGcntJblVVjVmyIQYGwazljZX_XrFOeq9vDO9rxOOEA8yNRqLoYJApuQANWXIbN9t7JcztpgrJXGFAVvzBQSN461JttB_3j2eG3cOcEChNM00NeVyye7DFZ4FGmZP4NeYnj65_qS2IOfg0teiUI940RpcrzK8TEgy-RB5dsJzEHSUXFrYchjruoZFhcOdsoOJG5ZPKZPc0NV9OPTRa0Nnz7EUvh8tU3ROXSFIvUFtKnLyl4F_dBfKFYvgf2W-N3ezD2Fp4J_2JlGhy5eOFNcRVgYHUo-q6Nqha7PC5b8deqrq6UolH9w9c66tDoJ0LHc2jlzM1rgVajtmHtsGa_E5vgIfBNy_f5526teI5VfVp_V_9EsN1q7q4zNULlwUGzyK5mmGYvDzPu95yHDYkFJYq3Vcuk-u2281w7J7ISsXbX4fs5OU
