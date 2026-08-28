#!/usr/bin/env python3
"""Re-encode AppFacts /v viewer URL from existing frontmatter (no LLM).

Usage:
  python scripts/reencode_app_facts_viewer.py /path/to/APP_FACTS.md
"""
from __future__ import annotations

import base64
import json
import re
import sys
import zlib
from pathlib import Path

import yaml

VIEWER_ORIGIN = "https://appfacts.dev"
VIEWER_PREFIX = "af1."
MAX_VIEWER_URL_LEN = 1600


def build_viewer_payload(
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


def encode_viewer_hash(payload) -> str:
    raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    compressed = zlib.compress(raw, 9)
    return VIEWER_PREFIX + base64.urlsafe_b64encode(compressed).decode("ascii").rstrip("=")


def viewer_url_for(fm) -> str:
    attempts = [
        dict(include_build=True, include_dep_purpose=True, include_services=True, max_deps=8, max_services=6),
        dict(include_build=False, include_dep_purpose=True, include_services=True, max_deps=8, max_services=6),
        dict(include_build=False, include_dep_purpose=True, include_services=True, max_deps=5, max_services=4),
        dict(include_build=False, include_dep_purpose=False, include_services=True, max_deps=5, max_services=4),
        dict(include_build=False, include_dep_purpose=False, include_services=False, max_deps=3, max_services=0),
    ]
    url = ""
    for opts in attempts:
        url = f"{VIEWER_ORIGIN}/v#{encode_viewer_hash(build_viewer_payload(fm, **opts))}"
        if len(url) <= MAX_VIEWER_URL_LEN:
            return url
    return url


def reencode(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)", text)
    if not m:
        raise SystemExit(f"missing frontmatter: {path}")
    fm = yaml.safe_load(m.group(1))
    url = viewer_url_for(fm)
    body = text[m.end() :]
    if re.search(r"\[appfacts-label\]:\s*\S+", body):
        body = re.sub(r"(\[appfacts-label\]:\s*)\S+", rf"\1{url}", body, count=1)
    else:
        body = body.rstrip() + f"\n\n[appfacts-label]: {url}\n"
    path.write_text(text[: m.end()] + body, encoding="utf-8", newline="\n")
    return url


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: reencode_app_facts_viewer.py APP_FACTS.md")
    path = Path(sys.argv[1])
    url = reencode(path)
    print(f"reencoded {path} → {url[:80]}…")


if __name__ == "__main__":
    main()
