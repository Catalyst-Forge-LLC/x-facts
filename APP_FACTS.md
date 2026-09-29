---
app_facts_version: 0.1.0
name: xFacts
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

# xFacts

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

[appfacts-label]: https://appfacts.dev/v#af1.eNqdUk1r3DAQ_SviHUJaZJtedWrZkA_Y9NLcSiizsuIoK2mENF7WXfLfg7xp78lNw_sa5umEA8w3jUTRweB4TVYqNGTJbd5s75QwB2hUIZkrDMiKPzhoBG9dqo12f_dwZtg9zAmB0jTT1JCHJbtftvgs0ChzEr_m_OTR9S9rEHPwaYJBTjniVWN0ucL8PiHB4Hvk0QXLSdxRcmFhy2Go4x4aGQZXzgYqblQ-qUx2T1Pz5dRDowWdPc9e9HL4nKp74hJpvctH1ZYSJ28p-L_uE_KFYviI7FFjN_swthbeSX8iJZpc-XdhDXFVYCD1qLquDaoWO3zt27OXqi4uVOLR_QfX-uoQaOdCR_Po5UyNa4GWY_ahbbAmv9Mb4GFw4-V23qkfVjynqi4zJRf6JYYvreriMlcvXBYYPIvkaoZh8vI873rLcdiQUFiqdNdcJtdtt5vh2D2tX_T1DXlo5T4
