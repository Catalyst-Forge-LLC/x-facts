#!/usr/bin/env python3
"""Re-encode AppFacts / ToolFacts / SkillFacts /v URLs from frontmatter (no LLM).

Usage:
  python scripts/reencode_facts_viewer.py /path/to/APP_FACTS.md
  python scripts/reencode_facts_viewer.py /path/to/TOOL_FACTS.md /path/to/SKILL_FACTS.md
"""
from __future__ import annotations

import base64
import json
import re
import sys
import zlib
from pathlib import Path

import yaml

MAX_VIEWER_URL_LEN = 1600

KINDS = {
    "APP_FACTS.md": {
        "origin": "https://appfacts.dev",
        "prefix": "af1.",
        "ref": "appfacts-label",
    },
    "TOOL_FACTS.md": {
        "origin": "https://toolfacts.dev",
        "prefix": "tf1.",
        "ref": "toolfacts-label",
    },
    "SKILL_FACTS.md": {
        "origin": "https://skillfacts.dev",
        "prefix": "sf1.",
        "ref": "skillfacts-label",
    },
}


def encode_hash(prefix: str, payload: dict) -> str:
    raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return prefix + base64.urlsafe_b64encode(zlib.compress(raw, 9)).decode("ascii").rstrip("=")


def app_payload(
    fm,
    include_build=True,
    include_dep_purpose=True,
    include_services=True,
    max_deps=8,
    max_services=6,
):
    deps = []
    for d in (fm.get("key_dependencies") or [])[:max_deps]:
        if not isinstance(d, dict) or not d.get("name"):
            continue
        item = {"n": d["name"]}
        if include_dep_purpose and d.get("purpose"):
            item["p"] = d["purpose"]
        deps.append(item)
    payload = {
        "v": 1,
        "name": fm.get("name"),
        "type": fm.get("type"),
        "status": fm.get("status"),
        "license": fm.get("license"),
        "stack": fm.get("stack") or {},
        "deps": deps,
    }
    if include_services and fm.get("services"):
        svc = [
            {"n": s["name"], "r": s["role"]}
            for s in fm["services"][:max_services]
            if isinstance(s, dict) and s.get("name") and s.get("role")
        ]
        if svc:
            payload["svc"] = svc
    if include_build and fm.get("build"):
        build = {
            k: v
            for k, v in fm["build"].items()
            if v is not None and str(v).lower() != "unknown"
        }
        if build:
            payload["build"] = build
    if fm.get("homepage"):
        payload["homepage"] = fm["homepage"]
    if fm.get("repository"):
        payload["repository"] = fm["repository"]
    return payload


def app_url(fm) -> str:
    attempts = [
        dict(include_build=True, include_dep_purpose=True, include_services=True, max_deps=8, max_services=6),
        dict(include_build=False, include_dep_purpose=True, include_services=True, max_deps=8, max_services=6),
        dict(include_build=False, include_dep_purpose=True, include_services=True, max_deps=5, max_services=4),
        dict(include_build=False, include_dep_purpose=False, include_services=True, max_deps=5, max_services=4),
        dict(include_build=False, include_dep_purpose=False, include_services=False, max_deps=3, max_services=0),
    ]
    url = ""
    origin = KINDS["APP_FACTS.md"]["origin"]
    prefix = KINDS["APP_FACTS.md"]["prefix"]
    for opts in attempts:
        url = f"{origin}/v#{encode_hash(prefix, app_payload(fm, **opts))}"
        if len(url) <= MAX_VIEWER_URL_LEN:
            return url
    return url


def tool_payload(fm: dict, *, purposes: bool, urls: bool, raw: str | None, max_tools: int) -> dict:
    tools_in = list(fm.get("tools") or [])
    rank_map = {"destructive": 0, "write": 1, "read": 2}

    def se_rank(t):
        return rank_map.get(t.get("side_effects"), 3)

    tools = []
    for t in sorted(tools_in, key=se_rank)[:max_tools]:
        reach = t.get("reach") or {}
        row = {
            "name": t.get("name"),
            "side_effects": t.get("side_effects"),
            "reach": {
                "filesystem": reach.get("filesystem"),
                "network": reach.get("network"),
                "processes": reach.get("processes"),
            },
            "idempotent": t.get("idempotent"),
        }
        if purposes and t.get("purpose"):
            row["purpose"] = t["purpose"]
        tools.append(row)
    payload = {
        "v": 1,
        "name": fm.get("name"),
        "developer": fm.get("developer"),
        "version": fm.get("version"),
        "status": fm.get("status"),
        "license": fm.get("license"),
        "kind": fm.get("kind"),
        "runtime": fm.get("runtime"),
        "credentials": fm.get("credentials"),
        "egress": fm.get("egress"),
        "tools": tools,
    }
    if urls:
        if fm.get("homepage"):
            payload["homepage"] = fm["homepage"]
        if fm.get("repository"):
            payload["repository"] = fm["repository"]
    if raw:
        payload["raw"] = raw
    if not purposes or not urls or not raw or len(tools) < len(tools_in):
        payload["truncated"] = True
    return payload


def tool_url(fm: dict, raw: str) -> str:
    origin = KINDS["TOOL_FACTS.md"]["origin"]
    prefix = KINDS["TOOL_FACTS.md"]["prefix"]
    attempts = [
        dict(purposes=True, urls=True, raw=raw, max_tools=24),
        dict(purposes=True, urls=True, raw=None, max_tools=24),
        dict(purposes=True, urls=False, raw=None, max_tools=16),
        dict(purposes=False, urls=False, raw=None, max_tools=12),
        dict(purposes=False, urls=False, raw=None, max_tools=8),
    ]
    url = ""
    for opts in attempts:
        url = f"{origin}/v#{encode_hash(prefix, tool_payload(fm, **opts))}"
        if len(url) <= MAX_VIEWER_URL_LEN:
            return url
    return url


def skill_payload(fm: dict, *, urls: bool, raw: str | None) -> dict:
    payload = {
        "v": 1,
        "name": fm.get("name"),
        "developer": fm.get("developer"),
        "version": fm.get("version"),
        "status": fm.get("status"),
        "license": fm.get("license"),
        "kind": fm.get("kind"),
        "purpose": fm.get("purpose"),
        "provenance": fm.get("provenance"),
        "instructions_reach": fm.get("instructions_reach"),
        "tools_referenced": fm.get("tools_referenced") or [],
        "bundled_artifacts": fm.get("bundled_artifacts") or [],
        "egress": fm.get("egress"),
    }
    if urls:
        if fm.get("homepage"):
            payload["homepage"] = fm["homepage"]
        if fm.get("repository"):
            payload["repository"] = fm["repository"]
    if raw:
        payload["raw"] = raw
    if not urls or not raw:
        payload["truncated"] = True
    return payload


def skill_url(fm: dict, raw: str) -> str:
    origin = KINDS["SKILL_FACTS.md"]["origin"]
    prefix = KINDS["SKILL_FACTS.md"]["prefix"]
    attempts = [
        dict(urls=True, raw=raw),
        dict(urls=True, raw=None),
        dict(urls=False, raw=None),
    ]
    url = ""
    for opts in attempts:
        url = f"{origin}/v#{encode_hash(prefix, skill_payload(fm, **opts))}"
        if len(url) <= MAX_VIEWER_URL_LEN:
            return url
    return url


def kind_for(path: Path) -> dict:
    kind = KINDS.get(path.name)
    if not kind:
        raise SystemExit(f"unsupported facts file: {path.name}")
    return kind


def viewer_url_for(path: Path, fm: dict, raw: str) -> str:
    name = path.name
    if name == "APP_FACTS.md":
        return app_url(fm)
    if name == "TOOL_FACTS.md":
        return tool_url(fm, raw)
    if name == "SKILL_FACTS.md":
        return skill_url(fm, raw)
    raise SystemExit(f"unsupported facts file: {name}")


def reencode(path: Path) -> tuple[str, bool]:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)", text)
    if not m:
        raise SystemExit(f"missing frontmatter: {path}")
    fm = yaml.safe_load(m.group(1)) or {}
    kind = kind_for(path)
    url = viewer_url_for(path, fm, text)
    ref = kind["ref"]
    body = text[m.end() :]
    existing = re.search(rf"\[{re.escape(ref)}\]:\s*(\S+)", body)
    if existing and existing.group(1) == url:
        return url, False
    if existing:
        body = re.sub(rf"(\[{re.escape(ref)}\]:\s*)\S+", rf"\1{url}", body, count=1)
    else:
        body = body.rstrip() + f"\n\n[{ref}]: {url}\n"
    path.write_text(text[: m.end()] + body, encoding="utf-8", newline="\n")
    return url, True


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: reencode_facts_viewer.py FACTS.md [FACTS.md ...]")
    for arg in sys.argv[1:]:
        path = Path(arg)
        url, wrote = reencode(path)
        verb = "reencoded" if wrote else "unchanged"
        print(f"{verb} {path} -> {url[:80]}...")


if __name__ == "__main__":
    main()
