#!/usr/bin/env python3
"""Encode ToolFacts / SkillFacts exemplars into /v viewer URLs (mirrors validator encode-viewer)."""
from __future__ import annotations

import base64
import json
import re
import zlib
from datetime import date
from pathlib import Path

import yaml

TODAY = date.today().isoformat()


def extract_fm(md: str) -> tuple[dict, str]:
    m = re.match(r"^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)", md)
    if not m:
        raise ValueError("missing frontmatter")
    return yaml.safe_load(m.group(1)), md


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def encode(prefix: str, payload: dict) -> str:
    raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return prefix + b64url(zlib.compress(raw, level=9))


def tool_payload(fm: dict, *, purposes: bool, urls: bool, raw: str | None, max_tools: int) -> dict:
    tools_in = list(fm.get("tools") or [])
    rank_map = {"destructive": 0, "write": 1, "read": 2}

    def se_rank(t):
        se = t.get("side_effects")
        return rank_map.get(se, 3)

    ranked = sorted(tools_in, key=se_rank)
    tools = []
    for t in ranked[:max_tools]:
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
    truncated = (
        not purposes
        or not urls
        or not raw
        or len(tools) < len(tools_in)
    )
    if truncated:
        payload["truncated"] = True
    return payload


def tool_viewer(fm: dict, raw: str) -> str:
    origin = "https://toolfacts.dev"
    attempts = [
        dict(purposes=True, urls=True, raw=raw, max_tools=24),
        dict(purposes=True, urls=True, raw=None, max_tools=24),
        dict(purposes=True, urls=False, raw=None, max_tools=16),
        dict(purposes=False, urls=False, raw=None, max_tools=12),
        dict(purposes=False, urls=False, raw=None, max_tools=8),
    ]
    url = ""
    for opts in attempts:
        url = "/v#" + encode("tf1.", tool_payload(fm, **opts))
        if len(origin + url) <= 1600:
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


def skill_viewer(fm: dict, raw: str) -> str:
    origin = "https://skillfacts.dev"
    attempts = [
        dict(urls=True, raw=raw),
        dict(urls=True, raw=None),
        dict(urls=False, raw=None),
    ]
    url = ""
    for opts in attempts:
        url = "/v#" + encode("sf1.", skill_payload(fm, **opts))
        if len(origin + url) <= 1600:
            return url
    return url


def update_tool_index() -> None:
    root = Path("z:/workspace/tool-facts")
    idx_path = root / "examples" / "index.json"
    idx = json.loads(idx_path.read_text(encoding="utf-8"))
    by = {e["slug"]: e for e in idx["exemplars"]}
    by["forgetrail-mcp"].update(
        {
            "worst_side_effects": "read",
            "filesystem": "scoped",
            "network": "none",
            "processes": False,
            "credentials_required": False,
            "dogfood": True,
        }
    )
    for n in [
        {
            "slug": "ollanet-mcp",
            "name": "ollanet MCP Server",
            "developer": "Catalyst Forge",
            "status": "active",
            "worst_side_effects": "destructive",
            "filesystem": "scoped",
            "network": "unrestricted",
            "processes": False,
            "credentials_required": False,
            "path": "ollanet-mcp/TOOL_FACTS.md",
            "dogfood": True,
        },
        {
            "slug": "dictawhisper-mcp",
            "name": "DictaWhisper MCP Server",
            "developer": "Catalyst Forge",
            "status": "active",
            "worst_side_effects": "read",
            "filesystem": "scoped",
            "network": "none",
            "processes": False,
            "credentials_required": False,
            "path": "dictawhisper-mcp/TOOL_FACTS.md",
            "dogfood": True,
        },
    ]:
        if n["slug"] not in by:
            idx["exemplars"].append(n)
            by[n["slug"]] = n
        else:
            by[n["slug"]].update({k: v for k, v in n.items() if k != "slug"})

    for ex in idx["exemplars"]:
        md = (root / "examples" / ex["slug"] / "TOOL_FACTS.md").read_text(encoding="utf-8")
        fm, raw = extract_fm(md)
        viewer = tool_viewer(fm, raw)
        ex["viewer"] = viewer
        print(f"tool {ex['slug']}: {len(viewer)} chars")

    idx["updated"] = TODAY
    text = json.dumps(idx, indent=2) + "\n"
    idx_path.write_text(text, encoding="utf-8", newline="\n")
    (root / "site" / "examples" / "index.json").write_text(text, encoding="utf-8", newline="\n")
    print("updated tool-facts index")


def update_skill_index() -> None:
    root = Path("z:/workspace/skill-facts")
    idx_path = root / "examples" / "index.json"
    idx = json.loads(idx_path.read_text(encoding="utf-8"))
    existing = {e["slug"] for e in idx["exemplars"]}

    def add(slug, name, kind, shell, network, filesystem, bundled):
        if slug in existing:
            return
        idx["exemplars"].append(
            {
                "slug": slug,
                "name": name,
                "kind": kind,
                "shell": shell,
                "network": network,
                "filesystem": filesystem,
                "bundled_artifacts": bundled,
                "path": f"{slug}/SKILL_FACTS.md",
                "dogfood": True,
            }
        )
        existing.add(slug)

    add("forgetrail", "forgetrail", "cursor-skill", "explicit", "implied", "read-write", 0)
    add("aibreze", "aibreze", "cursor-skill", "none", "implied", "read", 3)
    add("temper-pass-clarify-first", "clarify-first", "cursor-skill", "none", "none", "none", 0)
    add("temper-pass-red-team", "red-team", "cursor-skill", "none", "none", "none", 0)
    add("temper-pass-scope-lock", "scope-lock", "cursor-skill", "none", "none", "none", 0)
    add("temper-pass-tradeoff-matrix", "tradeoff-matrix", "cursor-skill", "none", "none", "none", 0)
    add("ember-dossier", "ember-dossier", "cursor-skill", "none", "implied", "none", 0)
    add("docupuncture-docs", "docupuncture-docs", "cursor-skill", "none", "implied", "none", 0)
    add("docupuncture-sheets", "docupuncture-sheets", "cursor-skill", "none", "implied", "none", 0)
    add("docupuncture-slides", "docupuncture-slides", "cursor-skill", "none", "implied", "none", 0)

    for e in idx["exemplars"]:
        if "dogfood" not in e:
            e["dogfood"] = False
        # dogfood shelf skills
        if e["slug"] in {
            "forgetrail",
            "aibreze",
            "temper-pass-clarify-first",
            "temper-pass-red-team",
            "temper-pass-scope-lock",
            "temper-pass-tradeoff-matrix",
            "ember-dossier",
            "docupuncture-docs",
            "docupuncture-sheets",
            "docupuncture-slides",
        }:
            e["dogfood"] = True

    for ex in idx["exemplars"]:
        md = (root / "examples" / ex["slug"] / "SKILL_FACTS.md").read_text(encoding="utf-8")
        fm, raw = extract_fm(md)
        viewer = skill_viewer(fm, raw)
        ex["viewer"] = viewer
        print(f"skill {ex['slug']}: {len(viewer)} chars")

    idx["updated"] = TODAY
    text = json.dumps(idx, indent=2) + "\n"
    idx_path.write_text(text, encoding="utf-8", newline="\n")
    (root / "site" / "examples" / "index.json").write_text(text, encoding="utf-8", newline="\n")
    print("updated skill-facts index")


def seed_app_examples() -> None:
    """Copy dogfood APP_FACTS into app-facts/examples/<slug>/ and build index.json."""
    root = Path("z:/workspace/app-facts")
    examples = root / "examples"
    apps = [
        ("forgetrail", "ForgeTrail", "https://forgetrail.dev"),
        ("ollanet", "ollanet", "https://ollanet.dev"),
        ("dictawhisper", "DictaWhisper", "https://dictawhisper.com"),
        ("aibreze", "aiBreze", "https://aibreze.com"),
        ("temper-pass", "TemperPass", "https://temperpass.dev"),
        ("ember-dossier", "EmberDossier", "https://emberdossier.com"),
        ("anticonfab", "anticonfab", None),
        ("filepress", "FilePress", "https://getfilepress.com"),
        ("ingotvault", "IngotVault", "https://ingotvault.dev"),
        ("finetuna", "Finetuna", "https://finetuna.net"),
        ("docupuncture", "Docupuncture", "https://docupuncture.dev"),
        ("localberth", "LocalBerth", "https://localberth.com"),
        ("localhelm", "LocalHelm", None),
    ]
    exemplars = []
    for slug, name, homepage in apps:
        src = Path(f"z:/workspace/{slug}/APP_FACTS.md")
        if not src.exists():
            print("skip missing", slug)
            continue
        dest_dir = examples / slug
        dest_dir.mkdir(parents=True, exist_ok=True)
        text = src.read_text(encoding="utf-8")
        (dest_dir / "APP_FACTS.md").write_text(text, encoding="utf-8", newline="\n")
        # extract viewer from markdown link
        m = re.search(r"\[appfacts-label\]:\s*(https://appfacts\.dev/v#\S+)", text)
        viewer = m.group(1).replace("https://appfacts.dev", "") if m else None
        fm, _ = extract_fm(text)
        exemplars.append(
            {
                "slug": slug,
                "name": name,
                "type": fm.get("type"),
                "status": fm.get("status"),
                "license": fm.get("license"),
                "homepage": homepage or fm.get("homepage"),
                "path": f"{slug}/APP_FACTS.md",
                "dogfood": True,
                "viewer": viewer,
            }
        )
        print("seeded app", slug, "viewer", bool(viewer))

    idx = {
        "label": "app-facts",
        "version": "0.1.0",
        "updated": TODAY,
        "schema": "https://appfacts.dev/schema/app-facts.schema.json",
        "note": "Dogfood exemplars from Catalyst Forge open-source shelf products.",
        "exemplars": exemplars,
    }
    text = json.dumps(idx, indent=2) + "\n"
    (examples / "index.json").write_text(text, encoding="utf-8", newline="\n")
    site_ex = root / "site" / "examples"
    site_ex.mkdir(parents=True, exist_ok=True)
    (site_ex / "index.json").write_text(text, encoding="utf-8", newline="\n")
    for e in exemplars:
        d = site_ex / e["slug"]
        d.mkdir(parents=True, exist_ok=True)
        src = examples / e["slug"] / "APP_FACTS.md"
        (d / "APP_FACTS.md").write_text(src.read_text(encoding="utf-8"), encoding="utf-8", newline="\n")
    print("updated app-facts index", len(exemplars))


if __name__ == "__main__":
    update_tool_index()
    update_skill_index()
    seed_app_examples()
