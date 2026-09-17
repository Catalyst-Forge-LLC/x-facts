# Canonicalization: `tool-facts`

Procedure name (record in `provenance.digest_canonicalization`):

`jcs-rfc8785+frontmatter-only+tools-sorted`

1. If the source is markdown, retain only the leading YAML frontmatter. Discard the body.
2. Parse YAML to an object.
3. Sort `tools` lexicographically by `name` (UTF-8 / JS string code-unit order).
4. Canonicalize the resulting object with JCS (RFC 8785).
5. SHA-256 the UTF-8 bytes of that form. Record as `sha256:` + hex.

Two parses of the same frontmatter MUST produce the same digest.
Changing this procedure is a major version bump of the profile.
