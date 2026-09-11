#!/usr/bin/env python3
"""Wire README + FilePress footer + catalyst-forge shelf pointers to nutrition labels."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

WS = Path("z:/workspace")


def app_viewer(slug: str) -> str:
    idx = json.loads((WS / "app-facts/examples/index.json").read_text(encoding="utf-8"))
    for e in idx["exemplars"]:
        if e["slug"] == slug and e.get("viewer"):
            return "https://appfacts.dev" + e["viewer"]
    raise KeyError(slug)


def tool_viewer(slug: str) -> str:
    idx = json.loads((WS / "tool-facts/examples/index.json").read_text(encoding="utf-8"))
    for e in idx["exemplars"]:
        if e["slug"] == slug and e.get("viewer"):
            return "https://toolfacts.dev" + e["viewer"]
    raise KeyError(slug)


def skill_viewer(slug: str) -> str:
    idx = json.loads((WS / "skill-facts/examples/index.json").read_text(encoding="utf-8"))
    for e in idx["exemplars"]:
        if e["slug"] == slug and e.get("viewer"):
            return "https://skillfacts.dev" + e["viewer"]
    raise KeyError(slug)


def skill_list(cfg: dict) -> list[dict]:
    if cfg.get("skills"):
        return list(cfg["skills"])
    if "skill" in cfg:
        slug, path = cfg["skill"]
        return [{"slug": slug, "path": path, "name": Path(path).parent.name}]
    return []


def skill_viewer_for(product: str, item: dict) -> str:
    path = WS / product / item["path"]
    if path.exists():
        match = re.search(r"\[skillfacts-label\]:\s*(\S+)", path.read_text(encoding="utf-8"))
        if match:
            return match.group(1)
    return skill_viewer(item["slug"])


# Product pointer config
PRODUCTS = {
    "forgetrail": {
        "github": "Catalyst-Forge-LLC/forgetrail",
        "app_raw": "APP_FACTS.md",
        "tool": ("forgetrail-mcp", "mcp-server/TOOL_FACTS.md"),
        "skill": ("forgetrail", "content/skills/forgetrail/SKILL_FACTS.md"),
        "filepress": "site/filepress.config.ts",
        "footer_labels": ["AppFacts", "ToolFacts", "SkillFacts"],
    },
    "ollanet": {
        "github": "Catalyst-Forge-LLC/ollanet",
        "app_raw": "APP_FACTS.md",
        "tool": ("ollanet-mcp", "TOOL_FACTS.md"),
        "filepress": "site/filepress.config.ts",
        "footer_labels": ["AppFacts", "ToolFacts"],
    },
    "dictawhisper": {
        "github": "Catalyst-Forge-LLC/dictawhisper",
        "app_raw": "APP_FACTS.md",
        "tool": ("dictawhisper-mcp", "TOOL_FACTS.md"),
        "filepress": "site/filepress.config.ts",
        "footer_labels": ["AppFacts", "ToolFacts"],
    },
    "smellcheck": {
        "github": "Catalyst-Forge-LLC/smellcheck",
        "app_raw": "APP_FACTS.md",
        "skill": ("smellcheck", "skills/smellcheck/SKILL_FACTS.md"),
        "filepress": "site/filepress.config.ts",
        "footer_labels": ["AppFacts", "SkillFacts"],
    },
    "temper-pass": {
        "github": "Catalyst-Forge-LLC/temper-pass",
        "app_raw": "APP_FACTS.md",
        "skills": [
            {"slug": "temper-pass-clarify-first", "path": "passes/clarify-first/SKILL_FACTS.md", "name": "clarify-first"},
            {"slug": "temper-pass-red-team", "path": "passes/red-team/SKILL_FACTS.md", "name": "red-team"},
            {"slug": "temper-pass-scope-lock", "path": "passes/scope-lock/SKILL_FACTS.md", "name": "scope-lock"},
            {"slug": "temper-pass-tradeoff-matrix", "path": "passes/tradeoff-matrix/SKILL_FACTS.md", "name": "tradeoff-matrix"},
        ],
        "filepress": "site/filepress.config.ts",
        "footer_labels": ["AppFacts", "SkillFacts"],
    },
    "ember-dossier": {
        "github": "Catalyst-Forge-LLC/ember-dossier",
        "app_raw": "APP_FACTS.md",
        "skill": ("ember-dossier", "skills/ember-dossier/SKILL_FACTS.md"),
        "filepress": "site/filepress.config.ts",
        "footer_labels": ["AppFacts", "SkillFacts"],
    },
    "anticonfab": {
        "github": "Catalyst-Forge-LLC/anticonfab",
        "app_raw": "APP_FACTS.md",
        "footer_labels": ["AppFacts"],
    },
    "filepress": {
        "github": "Catalyst-Forge-LLC/filepress",
        "app_raw": "APP_FACTS.md",
        "footer_labels": ["AppFacts"],
    },
    "ingotvault": {
        "github": "Catalyst-Forge-LLC/ingotvault",
        "app_raw": "APP_FACTS.md",
        "filepress": "site/filepress.config.ts",
        "footer_labels": ["AppFacts"],
    },
    "finetuna": {
        "github": "Catalyst-Forge-LLC/finetuna",
        "app_raw": "APP_FACTS.md",
        "filepress": "site/filepress.config.ts",
        "footer_labels": ["AppFacts"],
    },
    "docupuncture": {
        "github": "Catalyst-Forge-LLC/docupuncture",
        "app_raw": "APP_FACTS.md",
        "skills": [
            {"slug": "docupuncture-docs", "path": "skills/docupuncture-docs/SKILL_FACTS.md", "name": "docupuncture-docs"},
            {"slug": "docupuncture-sheets", "path": "skills/docupuncture-sheets/SKILL_FACTS.md", "name": "docupuncture-sheets"},
            {"slug": "docupuncture-slides", "path": "skills/docupuncture-slides/SKILL_FACTS.md", "name": "docupuncture-slides"},
        ],
        "filepress": "site/filepress.config.ts",
        "footer_labels": ["AppFacts", "SkillFacts"],
    },
    "localberth": {
        "github": "Catalyst-Forge-LLC/localberth",
        "app_raw": "APP_FACTS.md",
        "filepress": "site/filepress.config.ts",
        "footer_labels": ["AppFacts"],
    },
    "localhelm": {
        "github": "Catalyst-Forge-LLC/localhelm",
        "app_raw": "APP_FACTS.md",
        "footer_labels": ["AppFacts"],
    },
}

MARKER = "<!-- xfacts-nutrition-label -->"


def nutrition_block(slug: str, cfg: dict) -> str:
    gh = cfg["github"]
    app_v = app_viewer(slug)
    app_raw = f"https://github.com/{gh}/blob/main/{cfg['app_raw']}"
    lines = [
        MARKER,
        "",
        "## Nutrition label",
        "",
        f"- **AppFacts:** [viewer]({app_v}) · [raw]({app_raw})",
    ]
    if "tool" in cfg:
        tslug, tpath = cfg["tool"]
        tv = tool_viewer(tslug)
        traw = f"https://github.com/{gh}/blob/main/{tpath}"
        lines.append(f"- **ToolFacts:** [viewer]({tv}) · [raw]({traw})")
    skills = skill_list(cfg)
    if len(skills) == 1:
        item = skills[0]
        sv = skill_viewer_for(slug, item)
        sraw = f"https://github.com/{gh}/blob/main/{item['path']}"
        lines.append(f"- **SkillFacts:** [viewer]({sv}) · [raw]({sraw})")
    elif skills:
        lines.append("- **SkillFacts:**")
        for item in skills:
            sv = skill_viewer_for(slug, item)
            sraw = f"https://github.com/{gh}/blob/main/{item['path']}"
            lines.append(f"  - [{item['name']}]({sv}) · [raw]({sraw})")
    lines.append("")
    return "\n".join(lines)


def patch_readme(slug: str, cfg: dict) -> None:
    path = WS / slug / "README.md"
    if not path.exists():
        print("no README", slug)
        return
    text = path.read_text(encoding="utf-8")
    block = nutrition_block(slug, cfg)
    if MARKER in text:
        # replace existing block through next ## or EOF
        text = re.sub(
            rf"{re.escape(MARKER)}\n(?:.*?\n)*?(?=\n## (?!Nutrition label))",
            block + "\n",
            text,
            count=1,
            flags=re.S,
        )
    else:
        # insert before ## Development or at end before license-ish
        m = re.search(r"\n## (Development|License|Contributing)\b", text)
        if m:
            text = text[: m.start()] + "\n" + block + text[m.start() :]
        else:
            text = text.rstrip() + "\n\n" + block
    path.write_text(text, encoding="utf-8", newline="\n")
    print("readme", slug)


def footer_href(slug: str, cfg: dict, label: str) -> str:
    if label == "AppFacts":
        return app_viewer(slug)
    if label == "ToolFacts":
        return tool_viewer(cfg["tool"][0])
    if label == "SkillFacts":
        skills = skill_list(cfg)
        if not skills:
            raise ValueError("no skills")
        return skill_viewer_for(slug, skills[0])
    raise ValueError(label)


def skill_footer_entries(slug: str, cfg: dict) -> list[str]:
    skills = skill_list(cfg)
    if not skills:
        return []
    if len(skills) == 1:
        return [f"\t\t{{ label: 'SkillFacts', href: '{skill_viewer_for(slug, skills[0])}' }}"]
    return [
        f"\t\t{{ label: 'SkillFacts · {item['name']}', href: '{skill_viewer_for(slug, item)}' }}"
        for item in skills
    ]


def patch_filepress(slug: str, cfg: dict) -> None:
    rel = cfg.get("filepress")
    if not rel:
        return
    path = WS / slug / rel
    if not path.exists():
        print("no filepress", slug)
        return
    text = path.read_text(encoding="utf-8")
    skills = skill_list(cfg)
    if "label: 'AppFacts'" in text or 'label: "AppFacts"' in text:
        if len(skills) <= 1:
            print("filepress already", slug)
            return
        stripped = re.sub(
            r",\s*\{\s*label: 'SkillFacts(?: · [^']+)?',\s*href: '[^']+'\s*\}",
            "",
            text,
        )
        skill_block = ",\n".join(skill_footer_entries(slug, cfg))
        updated = re.sub(
            r"(\{\s*label: 'AppFacts',\s*href: '[^']+'\s*\})",
            r"\1,\n" + skill_block,
            stripped,
            count=1,
        )
        if updated == stripped:
            print("filepress no AppFacts slot", slug)
            return
        path.write_text(updated, encoding="utf-8", newline="\n")
        print("filepress skills", slug)
        return

    entries = []
    for label in cfg.get("footer_labels", []):
        if label == "SkillFacts":
            entries.extend(skill_footer_entries(slug, cfg))
            continue
        href = footer_href(slug, cfg, label)
        entries.append(f"\t\t{{ label: '{label}', href: '{href}' }}")
    entry_block = ",\n".join(entries)

    m = re.search(r"footerLinks:\s*\[([\s\S]*?)\]", text)
    if not m:
        print("no footerLinks", slug)
        return
    inner = m.group(1).rstrip()
    if inner and not inner.rstrip().endswith(","):
        new_inner = inner + ",\n" + entry_block + "\n\t"
    else:
        new_inner = inner + entry_block + "\n\t"
    text = text[: m.start(1)] + new_inner + text[m.end(1) :]
    path.write_text(text, encoding="utf-8", newline="\n")
    print("filepress", slug)


def patch_shelf() -> None:
    path = WS / "catalyst-forge/src/lib/projects.js"
    text = path.read_text(encoding="utf-8")

    # Map shelf project name -> (slug, optional extra labels)
    mapping = {
        "ForgeTrail": "forgetrail",
        "Smell Check": "smellcheck",
        "TemperPass": "temper-pass",
        "EmberDossier": "ember-dossier",
        "anticonfab": "anticonfab",
        "FilePress": "filepress",
        "IngotVault": "ingotvault",
        "Finetuna": "finetuna",
        "ollanet": "ollanet",
        "Docupuncture": "docupuncture",
        "DictaWhisper": "dictawhisper",
        "LocalBerth": "localberth",
        "LocalHelm": "localhelm",
    }

    for name, slug in mapping.items():
        # find project block by name: 'X'
        pattern = rf"(name: '{re.escape(name)}',[\s\S]*?links: \[)([\s\S]*?)(\n\s*\],)"
        m = re.search(pattern, text)
        if not m:
            print("shelf miss", name)
            continue
        links_inner = m.group(2)
        if "AppFacts" in links_inner:
            print("shelf already", name)
            continue
        href = app_viewer(slug)
        # insert AppFacts link as last link
        addition = f"\n          {{ label: 'AppFacts', href: '{href}' }},"
        # ensure trailing comma on last existing link line
        new_inner = links_inner.rstrip()
        if not new_inner.endswith(","):
            # add comma after last }
            new_inner = re.sub(r"(\})(\s*)$", r"\1,\2", new_inner)
        new_inner = new_inner + addition
        text = text[: m.start(2)] + new_inner + text[m.end(2) :]
        print("shelf", name)

    path.write_text(text, encoding="utf-8", newline="\n")


def main() -> None:
    only = {name for name in sys.argv[1:] if not name.startswith("-")}
    for slug, cfg in PRODUCTS.items():
        if only and slug not in only:
            continue
        patch_readme(slug, cfg)
        patch_filepress(slug, cfg)
    if not only:
        patch_shelf()
    print("pointers done")


if __name__ == "__main__":
    main()
