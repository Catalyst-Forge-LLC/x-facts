# Profile: `mcp-tools-list` 0.1.0

**Layer:** `tool`  
**Source:** MCP `tools/list` result (JSON-RPC `result`, or the SDK `listTools` payload)  
**Source version:** MCP 2025-03-26 (annotations as specified)  
**Verification ceiling:** `derived`  
**Digest:** `jcs-rfc8785+envelope-stripped+tools-sorted`

This profile is **not** an official MCP implementation, registry, or successor.
Canonical MCP home: https://modelcontextprotocol.io/

## Discovery

- `--stdio -- <command> [args…]` — spawn a local MCP server, initialize, call `tools/list`.
- `--http <url>` — Streamable HTTP transport.
- `--source <file>` — a saved `tools/list` result (for CI vectors and integrity).

## Field mapping

See [`mapping.json`](./mapping.json). Summary:

| Row key | Source | Missing |
|---|---|---|
| `kind` | Protocol observed (`mcp-server`) | never |
| `runtime` | Transport used to fetch | `undisclosed` if source file has no transport |
| `transport` | Transport used to fetch | `undisclosed` if unknown |
| `credentials` | not in `tools/list` | `undisclosed` |
| `side_effects_worst` | `annotations.destructiveHint` / `readOnlyHint` | `undisclosed` unless every tool states a hint, or a stated hint is already `destructive` |
| `filesystem` | not in `tools/list` | `undisclosed` |
| `network` | `annotations.openWorldHint === true` → `unrestricted` | `undisclosed` otherwise (false is not `none`) |
| `processes` | not in `tools/list` | `undisclosed` |
| `egress_destinations` | not in `tools/list` | `undisclosed` |
| `telemetry` | not in `tools/list` | `undisclosed` |
| `idempotent` | `annotations.idempotentHint` | `undisclosed` unless every tool states it, or any stated `false` |
| `license` | not in `tools/list` | `undisclosed` |

No inference from tool names or descriptions. A profile that emits `undisclosed` on half its rows and is right about all of them is a success.

## Conservative collapse

When several tools map to one row, emit the harsher stated value. If any tool is silent on that key and the harshest enum member has not already been observed, emit `undisclosed`.

## Verification

Live or recorded `tools/list` → `derived`. No signature checking. `signature` is `none`.

## Attribution

`Panel derived from MCP tools/list by xFacts. Not an official MCP artifact.`
