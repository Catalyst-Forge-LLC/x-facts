# Profile: `tool-facts` 0.1.0

**Layer:** `tool`  
**Source:** `TOOL_FACTS.md` YAML frontmatter  
**Source version:** ToolFacts 0.1.x  
**Verification ceiling:** `self-asserted`  
**Digest:** `jcs-rfc8785+frontmatter-only+tools-sorted`  
**Status:** Native / xFacts-defined stopgap

This profile exists because MCP annotations are optional and cannot state
filesystem, credentials, license, or egress. Do not invest in authoring UX.
Deprecate this profile if MCP grows equivalent structured fields.

Every renderer and badge MUST mark output **native / xFacts-defined**.

## Discovery

- `--source path/to/TOOL_FACTS.md` — parse the leading YAML frontmatter.
- A parsed frontmatter object (for tests) is also accepted.

The markdown body is not read. Frontmatter is the sole source of truth.

## Field mapping

See [`mapping.json`](./mapping.json). Summary:

| Row key | Source | Missing |
|---|---|---|
| `kind` | `kind` (`mcp-server`) | `undisclosed` |
| `runtime` | `runtime.execution` | `undisclosed` |
| `transport` | `runtime.transport` | `undisclosed` |
| `credentials` | empty `credentials.required` → `none`; otherwise `required` | `undisclosed` |
| `side_effects_worst` | conservative collapse of `tools[].side_effects` | `undisclosed` if any tool is silent |
| `filesystem` | collapse of `tools[].reach.filesystem` | `undisclosed` if any tool is silent |
| `network` | collapse of `tools[].reach.network` | `undisclosed` if any tool is silent |
| `processes` | collapse of `tools[].reach.processes` | `undisclosed` if any tool is silent |
| `egress_destinations` | empty list → `none`; named hosts → `named` | `undisclosed` if the list contains `undisclosed` |
| `telemetry` | `egress.telemetry` | `undisclosed` |
| `idempotent` | collapse of `tools[].idempotent` | `undisclosed` if any tool is silent |
| `license` | `license` | `undisclosed` |

No inference from purpose lines or tool names.

## Conservative collapse

When several tools map to one row, emit the harsher stated value. If any tool is silent on that key and the harshest enum member has not already been observed, emit `undisclosed`.

## Verification

Publisher-authored frontmatter → `self-asserted`. `signature` is `none`.

## Attribution

`Panel projected from TOOL_FACTS.md by xFacts. Native / xFacts-defined stopgap, not a live tools/list.`
