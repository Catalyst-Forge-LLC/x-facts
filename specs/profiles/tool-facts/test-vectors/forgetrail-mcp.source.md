---
tool_facts_version: "0.1.0"
name: ForgeTrail MCP Server
developer: Catalyst Forge
version: "0.3.10"
status: active
license: Apache-2.0
kind: mcp-server
homepage: https://forgetrail.dev
repository: https://github.com/Catalyst-Forge-LLC/forgetrail
runtime:
  execution: local-process
  transport: stdio
credentials:
  required: []
egress:
  telemetry: none
  destinations: []
tools:
  - name: ping
    purpose: "Connectivity check: returns ok, package version, FORGETRAIL_ROOT, and whether WORKFLOW.md was found"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getPhaseGuidance
    purpose: "Return methodology guidance for a development phase (1-7)"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: searchLessons
    purpose: "Search the ForgeTrail lesson database by keyword"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getTemplate
    purpose: "Return a ForgeTrail document template from docs/*.md"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: runAudit
    purpose: "Return a structured audit prompt for the current project (does not scan the workspace itself)"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getChecklist
    purpose: "Return a project checklist for a milestone or the full checklist"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getTrackingSchema
    purpose: "Return the workflow_tracking.json schema reference"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getAntiPatterns
    purpose: "Return documented anti-patterns from the methodology"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getProgressiveDocSchedule
    purpose: "Return which doc templates to create in each phase"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getNewProjectKickoff
    purpose: "Return greenfield bootstrap payload including starter tracking and optional Cursor rules"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: kickoffGreenfield
    purpose: "Same as getNewProjectKickoff with includeCursorRule true and no parameters"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: kickoffGreenfieldNoCursor
    purpose: "Same as kickoffGreenfield without the Cursor rule section"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getNewProjectBootstrap
    purpose: "Return MCP-first instructions to start a greenfield project without copying ForgeTrail into the repo"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getForgeTrailLite
    purpose: "Return the FORGETRAIL_LITE.md portable kickoff protocol"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getForgeTrailLiteUpdates
    purpose: "Return the Lite updates starter for logging protocol gaps"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getForgeTrailCursorPhaseRule
    purpose: "Return the optional Cursor phase-status rule (.mdc)"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getForgeTrailCursorLessonsRules
    purpose: "Return Cursor rules for lessons gate and MCP lessons usage"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getScaffoldInstallParams
    purpose: "Return JSON defaults for scripted Phase-2 setup"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getGenesisSpecPrompt
    purpose: "Return a copy-paste prompt for producing docs/GENESIS.md in an external LLM"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getGreenfieldIntakePrompt
    purpose: "Return Phase 1 structured questions about exports, tenancy, and delivery gaps"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getResumeSessionInstructions
    purpose: "Return instructions for continuing work in a later MCP-only session"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getInitialWorkflowTracking
    purpose: "Return starter .forgetrail/workflow_tracking.json for a new repo"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getPostBootstrapUserMessage
    purpose: "Return canonical short first-reply guidance after bootstrap files are written"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getUserReplyFormat
    purpose: "Return guidance for formatting options and next steps to users"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: validateTracking
    purpose: "Validate .forgetrail/workflow_tracking.json (inline JSON or optional filesystem path) against schema and phase rules"
    side_effects: read
    reach:
      filesystem: scoped
      network: none
      processes: false
    idempotent: true
  - name: suggestSubagentDecomposition
    purpose: "Return recommended subagent spawn parameters for a phase and task"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: ingestPlanArtifact
    purpose: "Map an approved plan artifact into a PHASE_1_BRIEF.md draft plus decisions[] entries"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getCompanionSuggestions
    purpose: "Return optional Catalyst Forge companion tools for a ForgeTrail phase or situation"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getPlanModePatterns
    purpose: "Return guidance for using native agent plan modes as Phase 1"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getAgentIntegrationGuide
    purpose: "Return tailored ForgeTrail bootstrap mappings for a specific agent host"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
  - name: getForgeTrailSkill
    purpose: "Return the canonical forgetrail SKILL.md for skill-capable agents"
    side_effects: none
    reach:
      filesystem: none
      network: none
      processes: false
    idempotent: true
generated:
  date: 2026-09-16
  generator: hand-authored (tools inventory from forgetrail-mcp 0.3.10)
credits:
  generated_with: https://toolfacts.dev
  built_by: "Catalyst Forge - https://www.catalystforge.com/"
---

# Tool Facts - ForgeTrail MCP Server

| | |
|---|---|
| **Developer** | Catalyst Forge |
| **Version** | 0.3.10 |
| **Status** | active |
| **License** | Apache-2.0 |
| **Kind** | mcp-server |
| **Reviewed** | 2026-09-16 against forgetrail-mcp 0.3.10 (`tools/list` inventory, hand-authored) |

`runAudit` returns a structured audit prompt. It does not scan the workspace or perform the audit. Following those instructions is a later host or agent action, and that later action is outside this tool's labeled side effects.

This file is bound to server version 0.3.10 and the 2026-09-16 review. A later package can change tools or implementations while an old copy of this file remains. Comparing a live `tools/list` can show added, removed, or renamed tools. It cannot prove that a same-named tool still does what this label says.

## Runtime

| | |
|---|---|
| Execution | local-process |
| Transport | stdio |

## Credentials

None required.

## Egress

| | |
|---|---|
| Telemetry | none |
| Destinations | (none) |

## Tools (31)

| Tool | Side effects | Filesystem | Network | Processes | Idempotent |
|---|---|---|---|---|---|
| `ping` | none | none | none | no | yes |
| `getPhaseGuidance` | none | none | none | no | yes |
| `searchLessons` | none | none | none | no | yes |
| `getTemplate` | none | none | none | no | yes |
| `runAudit` | none | none | none | no | yes |
| `getChecklist` | none | none | none | no | yes |
| `getTrackingSchema` | none | none | none | no | yes |
| `getAntiPatterns` | none | none | none | no | yes |
| `getProgressiveDocSchedule` | none | none | none | no | yes |
| `getNewProjectKickoff` | none | none | none | no | yes |
| `kickoffGreenfield` | none | none | none | no | yes |
| `kickoffGreenfieldNoCursor` | none | none | none | no | yes |
| `getNewProjectBootstrap` | none | none | none | no | yes |
| `getForgeTrailLite` | none | none | none | no | yes |
| `getForgeTrailLiteUpdates` | none | none | none | no | yes |
| `getForgeTrailCursorPhaseRule` | none | none | none | no | yes |
| `getForgeTrailCursorLessonsRules` | none | none | none | no | yes |
| `getScaffoldInstallParams` | none | none | none | no | yes |
| `getGenesisSpecPrompt` | none | none | none | no | yes |
| `getGreenfieldIntakePrompt` | none | none | none | no | yes |
| `getResumeSessionInstructions` | none | none | none | no | yes |
| `getInitialWorkflowTracking` | none | none | none | no | yes |
| `getPostBootstrapUserMessage` | none | none | none | no | yes |
| `getUserReplyFormat` | none | none | none | no | yes |
| `validateTracking` | read | scoped | none | no | yes |
| `suggestSubagentDecomposition` | none | none | none | no | yes |
| `ingestPlanArtifact` | none | none | none | no | yes |
| `getCompanionSuggestions` | none | none | none | no | yes |
| `getPlanModePatterns` | none | none | none | no | yes |
| `getAgentIntegrationGuide` | none | none | none | no | yes |
| `getForgeTrailSkill` | none | none | none | no | yes |

**Purpose lines**

| Tool | Purpose |
|---|---|
| `ping` | Connectivity check: returns ok, package version, FORGETRAIL_ROOT, and whether WORKFLOW.md was found |
| `getPhaseGuidance` | Return methodology guidance for a development phase (1-7) |
| `searchLessons` | Search the ForgeTrail lesson database by keyword |
| `getTemplate` | Return a ForgeTrail document template from docs/*.md |
| `runAudit` | Return a structured audit prompt for the current project (does not scan the workspace itself) |
| `getChecklist` | Return a project checklist for a milestone or the full checklist |
| `getTrackingSchema` | Return the workflow_tracking.json schema reference |
| `getAntiPatterns` | Return documented anti-patterns from the methodology |
| `getProgressiveDocSchedule` | Return which doc templates to create in each phase |
| `getNewProjectKickoff` | Return greenfield bootstrap payload including starter tracking and optional Cursor rules |
| `kickoffGreenfield` | Same as getNewProjectKickoff with includeCursorRule true and no parameters |
| `kickoffGreenfieldNoCursor` | Same as kickoffGreenfield without the Cursor rule section |
| `getNewProjectBootstrap` | Return MCP-first instructions to start a greenfield project without copying ForgeTrail into the repo |
| `getForgeTrailLite` | Return the FORGETRAIL_LITE.md portable kickoff protocol |
| `getForgeTrailLiteUpdates` | Return the Lite updates starter for logging protocol gaps |
| `getForgeTrailCursorPhaseRule` | Return the optional Cursor phase-status rule (.mdc) |
| `getForgeTrailCursorLessonsRules` | Return Cursor rules for lessons gate and MCP lessons usage |
| `getScaffoldInstallParams` | Return JSON defaults for scripted Phase-2 setup |
| `getGenesisSpecPrompt` | Return a copy-paste prompt for producing docs/GENESIS.md in an external LLM |
| `getGreenfieldIntakePrompt` | Return Phase 1 structured questions about exports, tenancy, and delivery gaps |
| `getResumeSessionInstructions` | Return instructions for continuing work in a later MCP-only session |
| `getInitialWorkflowTracking` | Return starter .forgetrail/workflow_tracking.json for a new repo |
| `getPostBootstrapUserMessage` | Return canonical short first-reply guidance after bootstrap files are written |
| `getUserReplyFormat` | Return guidance for formatting options and next steps to users |
| `validateTracking` | Validate .forgetrail/workflow_tracking.json (inline JSON or optional filesystem path) against schema and phase rules |
| `suggestSubagentDecomposition` | Return recommended subagent spawn parameters for a phase and task |
| `ingestPlanArtifact` | Map an approved plan artifact into a PHASE_1_BRIEF.md draft plus decisions[] entries |
| `getCompanionSuggestions` | Return optional Catalyst Forge companion tools for a ForgeTrail phase or situation |
| `getPlanModePatterns` | Return guidance for using native agent plan modes as Phase 1 |
| `getAgentIntegrationGuide` | Return tailored ForgeTrail bootstrap mappings for a specific agent host |
| `getForgeTrailSkill` | Return the canonical forgetrail SKILL.md for skill-capable agents |

---
*Generated with [ToolFacts](https://toolfacts.dev) · Built by [Catalyst Forge](https://www.catalystforge.com/)*
