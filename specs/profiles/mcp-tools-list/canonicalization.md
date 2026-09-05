# Canonicalization: `mcp-tools-list`

Procedure name (record in `provenance.digest_canonicalization`):

`jcs-rfc8785+envelope-stripped+tools-sorted`

1. If the document is a JSON-RPC response, retain only `result`. Discard `jsonrpc`, `id`, and framing.
2. Sort `tools` lexicographically by `name` (UTF-8 / JS string code-unit order).
3. Canonicalize the resulting object with JCS (RFC 8785).
4. SHA-256 the UTF-8 bytes of that form. Record as `sha256:` + hex.

Two runs against an unchanged server MUST produce the same digest.
Changing this procedure is a major version bump of the profile.
