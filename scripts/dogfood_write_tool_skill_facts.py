#!/usr/bin/env python3
"""Write ForgeTrail / ollanet / dictawhisper ToolFacts and shelf SkillFacts."""
from __future__ import annotations

from datetime import date
from pathlib import Path

TODAY = date.today().isoformat()
BUILT_BY = "Catalyst Forge - https://www.catalystforge.com/"


def q(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def write_tool_facts(
    *,
    dests: list[Path],
    name: str,
    version: str,
    homepage: str,
    repository: str,
    tools: list[tuple],
    note: str,
) -> None:
    lines = [
        "---",
        'tool_facts_version: "0.1.0"',
        f"name: {name}",
        "developer: Catalyst Forge",
        f"version: {q(version)}",
        "status: active",
        "license: Apache-2.0",
        "kind: mcp-server",
        f"homepage: {homepage}",
        f"repository: {repository}",
        "runtime:",
        "  execution: local-process",
        "  transport: stdio",
        "credentials:",
        "  required: []",
        "egress:",
        "  telemetry: none",
        "  destinations: []",
        "tools:",
    ]
    for tname, purpose, se, fs, net, proc, idem in tools:
        lines += [
            f"  - name: {tname}",
            f"    purpose: {q(purpose)}",
            f"    side_effects: {se}",
            "    reach:",
            f"      filesystem: {fs}",
            f"      network: {net}",
            f'      processes: {"true" if proc else "false"}',
            f'    idempotent: {"true" if idem else "false"}',
        ]
    lines += [
        "generated:",
        f"  date: {TODAY}",
        f"  generator: hand-authored ({note})",
        "credits:",
        "  generated_with: https://toolfacts.dev",
        f'  built_by: "{BUILT_BY}"',
        "---",
        "",
        f"# Tool Facts - {name}",
        "",
        "| | |",
        "|---|---|",
        "| **Developer** | Catalyst Forge |",
        f"| **Version** | {version} |",
        "| **Status** | active |",
        "| **License** | Apache-2.0 |",
        "| **Kind** | mcp-server |",
        "",
        "## Runtime",
        "",
        "| | |",
        "|---|---|",
        "| Execution | local-process |",
        "| Transport | stdio |",
        "",
        "## Credentials",
        "",
        "None required.",
        "",
        "## Egress",
        "",
        "| | |",
        "|---|---|",
        "| Telemetry | none |",
        "| Destinations | (none) |",
        "",
        f"## Tools ({len(tools)})",
        "",
        "| Tool | Side effects | Filesystem | Network | Processes | Idempotent |",
        "|---|---|---|---|---|---|",
    ]
    for tname, purpose, se, fs, net, proc, idem in tools:
        lines.append(
            f"| `{tname}` | {se} | {fs} | {net} | {'yes' if proc else 'no'} | {'yes' if idem else 'no'} |"
        )
    lines += ["", "**Purpose lines**", "", "| Tool | Purpose |", "|---|---|"]
    for tname, purpose, *_ in tools:
        lines.append(f"| `{tname}` | {purpose} |")
    lines += [
        "",
        "---",
        "*Generated with [ToolFacts](https://toolfacts.dev) · Built by [Catalyst Forge](https://www.catalystforge.com/)*",
        "",
    ]
    text = "\n".join(lines)
    for dest in dests:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(text, encoding="utf-8", newline="\n")
        print("wrote", dest)


def write_skill_facts(
    *,
    dests: list[Path],
    name: str,
    version: str,
    purpose: str,
    kind: str,
    homepage: str | None,
    repository: str,
    shell: str,
    network: str,
    filesystem: str,
    tools_referenced: list[str],
    bundled: list[tuple[str, str]] | None = None,
    body_note: str = "",
) -> None:
    bundled = bundled or []
    lines = [
        "---",
        'skill_facts_version: "0.1.0"',
        f"name: {name}",
        "developer: Catalyst Forge",
        f"version: {q(version)}",
        "status: active",
        "license: Apache-2.0",
        f"kind: {kind}",
        f"purpose: {q(purpose)}",
    ]
    if homepage:
        lines.append(f"homepage: {homepage}")
    lines += [
        f"repository: {repository}",
        "provenance:",
        f"  source: {repository}",
        "  publisher: Catalyst Forge",
        "instructions_reach:",
        f"  shell: {shell}",
        f"  network: {network}",
        f"  filesystem: {filesystem}",
        "tools_referenced:",
    ]
    if tools_referenced:
        for tr in tools_referenced:
            lines.append(f"  - {tr}")
    else:
        lines.append("  []")
    lines.append("bundled_artifacts:")
    if bundled:
        for path, kind_b in bundled:
            lines += [f"  - path: {path}", f"    kind: {kind_b}"]
    else:
        lines.append("  []")
    lines += [
        "egress:",
        "  telemetry: none",
        "  destinations: []",
        "generated:",
        f"  date: {TODAY}",
        "  generator: hand-authored",
        "credits:",
        "  generated_with: https://skillfacts.dev",
        f'  built_by: "{BUILT_BY}"',
        "---",
        "",
        f"# Skill Facts - {name}",
        "",
        "| | |",
        "|---|---|",
        "| **Developer** | Catalyst Forge |",
        f"| **Version** | {version} |",
        "| **Status** | active |",
        "| **License** | Apache-2.0 |",
        f"| **Kind** | {kind} |",
        "",
    ]
    if body_note:
        lines += [body_note, ""]
    lines += [
        "## Purpose",
        "",
        purpose,
        "",
        "## Provenance",
        "",
        "| | |",
        "|---|---|",
        f"| Source | {repository} |",
        "| Publisher | Catalyst Forge |",
        "",
        "## Instructions reach",
        "",
        "| | |",
        "|---|---|",
        f"| Shell | {shell} |",
        f"| Network | {network} |",
        f"| Filesystem | {filesystem} |",
        "",
        "## Tools referenced",
        "",
    ]
    if tools_referenced:
        for tr in tools_referenced:
            lines.append(f"- {tr}")
    else:
        lines.append("(none)")
    lines += ["", "## Bundled artifacts", ""]
    if bundled:
        lines += ["| Path | Kind |", "|---|---|"]
        for path, kind_b in bundled:
            lines.append(f"| {path} | {kind_b} |")
    else:
        lines.append("(none)")
    lines += [
        "",
        "## Egress",
        "",
        "| | |",
        "|---|---|",
        "| Telemetry | none |",
        "| Destinations | (none) |",
        "",
        "---",
        "*Generated with [SkillFacts](https://skillfacts.dev) · Built by [Catalyst Forge](https://www.catalystforge.com/)*",
        "",
    ]
    text = "\n".join(lines)
    for dest in dests:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(text, encoding="utf-8", newline="\n")
        print("wrote", dest)


def main() -> None:
    # ForgeTrail MCP
    ft_tools = [
        ("ping", "Connectivity check: returns ok, package version, FORGETRAIL_ROOT, and whether WORKFLOW.md was found", "none", "none", "none", False, True),
        ("getPhaseGuidance", "Return methodology guidance for a development phase (1-7)", "none", "none", "none", False, True),
        ("searchLessons", "Search the ForgeTrail lesson database by keyword", "none", "none", "none", False, True),
        ("getTemplate", "Return a ForgeTrail document template from docs/*.md", "none", "none", "none", False, True),
        ("runAudit", "Return a structured audit prompt for the current project (does not scan the workspace itself)", "none", "none", "none", False, True),
        ("getChecklist", "Return a project checklist for a milestone or the full checklist", "none", "none", "none", False, True),
        ("getTrackingSchema", "Return the workflow_tracking.json schema reference", "none", "none", "none", False, True),
        ("getAntiPatterns", "Return documented anti-patterns from the methodology", "none", "none", "none", False, True),
        ("getProgressiveDocSchedule", "Return which doc templates to create in each phase", "none", "none", "none", False, True),
        ("getNewProjectKickoff", "Return greenfield bootstrap payload including starter tracking and optional Cursor rules", "none", "none", "none", False, True),
        ("kickoffGreenfield", "Same as getNewProjectKickoff with includeCursorRule true and no parameters", "none", "none", "none", False, True),
        ("kickoffGreenfieldNoCursor", "Same as kickoffGreenfield without the Cursor rule section", "none", "none", "none", False, True),
        ("getNewProjectBootstrap", "Return MCP-first instructions to start a greenfield project without copying ForgeTrail into the repo", "none", "none", "none", False, True),
        ("getForgeTrailLite", "Return the FORGETRAIL_LITE.md portable kickoff protocol", "none", "none", "none", False, True),
        ("getForgeTrailLiteUpdates", "Return the Lite updates starter for logging protocol gaps", "none", "none", "none", False, True),
        ("getForgeTrailCursorPhaseRule", "Return the optional Cursor phase-status rule (.mdc)", "none", "none", "none", False, True),
        ("getForgeTrailCursorLessonsRules", "Return Cursor rules for lessons gate and MCP lessons usage", "none", "none", "none", False, True),
        ("getScaffoldInstallParams", "Return JSON defaults for scripted Phase-2 setup", "none", "none", "none", False, True),
        ("getGenesisSpecPrompt", "Return a copy-paste prompt for producing docs/GENESIS.md in an external LLM", "none", "none", "none", False, True),
        ("getGreenfieldIntakePrompt", "Return Phase 1 structured questions about exports, tenancy, and delivery gaps", "none", "none", "none", False, True),
        ("getResumeSessionInstructions", "Return instructions for continuing work in a later MCP-only session", "none", "none", "none", False, True),
        ("getInitialWorkflowTracking", "Return starter .forgetrail/workflow_tracking.json for a new repo", "none", "none", "none", False, True),
        ("getPostBootstrapUserMessage", "Return canonical short first-reply guidance after bootstrap files are written", "none", "none", "none", False, True),
        ("getUserReplyFormat", "Return guidance for formatting options and next steps to users", "none", "none", "none", False, True),
        ("validateTracking", "Validate .forgetrail/workflow_tracking.json (inline JSON or optional filesystem path) against schema and phase rules", "read", "scoped", "none", False, True),
        ("suggestSubagentDecomposition", "Return recommended subagent spawn parameters for a phase and task", "none", "none", "none", False, True),
        ("ingestPlanArtifact", "Map an approved plan artifact into a PHASE_1_BRIEF.md draft plus decisions[] entries", "none", "none", "none", False, True),
        ("getPlanModePatterns", "Return guidance for using native agent plan modes as Phase 1", "none", "none", "none", False, True),
        ("getAgentIntegrationGuide", "Return tailored ForgeTrail bootstrap mappings for a specific agent host", "none", "none", "none", False, True),
        ("getForgeTrailSkill", "Return the canonical forgetrail SKILL.md for skill-capable agents", "none", "none", "none", False, True),
    ]
    write_tool_facts(
        dests=[
            Path("z:/workspace/forgetrail/mcp-server/TOOL_FACTS.md"),
            Path("z:/workspace/tool-facts/examples/forgetrail-mcp/TOOL_FACTS.md"),
            Path("z:/workspace/tool-facts/site/examples/forgetrail-mcp/TOOL_FACTS.md"),
        ],
        name="ForgeTrail MCP Server",
        version="0.2.2",
        homepage="https://forgetrail.dev",
        repository="https://github.com/Catalyst-Forge-LLC/forgetrail",
        tools=ft_tools,
        note="tools inventory from forgetrail-mcp 0.2.2",
    )

    write_skill_facts(
        dests=[
            Path("z:/workspace/forgetrail/content/skills/forgetrail/SKILL_FACTS.md"),
            Path("z:/workspace/skill-facts/examples/forgetrail/SKILL_FACTS.md"),
            Path("z:/workspace/skill-facts/site/examples/forgetrail/SKILL_FACTS.md"),
        ],
        name="forgetrail",
        version="0.3.0",
        purpose="Enforce the ForgeTrail 7-phase lifecycle and maintain .forgetrail/workflow_tracking.json as the system of record",
        kind="cursor-skill",
        homepage="https://forgetrail.dev",
        repository="https://github.com/Catalyst-Forge-LLC/forgetrail",
        shell="explicit",
        network="implied",
        filesystem="read-write",
        tools_referenced=[
            "https://github.com/Catalyst-Forge-LLC/forgetrail/blob/main/mcp-server/TOOL_FACTS.md",
            "getPhaseGuidance",
            "runAudit",
            "searchLessons",
            "validateTracking",
            "suggestSubagentDecomposition",
            "getTemplate",
            "getNewProjectKickoff",
            "getResumeSessionInstructions",
        ],
        body_note="*Lifecycle playbook with explicit shell and read-write filesystem reach. Points at ForgeTrail MCP ToolFacts.*",
    )

    # ollanet MCP
    ol_tools = [
        ("ollanet_scan", "Discover reachable Ollama hosts and list their models; optional LAN TCP scan", "read", "none", "unrestricted", False, True),
        ("ollanet_prompt", "Send a prompt to an Ollama host or continue a saved chat; may persist transcript locally", "write", "scoped", "unrestricted", False, False),
        ("ollanet_compare", "Run the same prompt against multiple hosts/models and return a comparison", "write", "scoped", "unrestricted", False, False),
        ("ollanet_pull", "Pull (download) a model onto a remote Ollama host", "write", "none", "unrestricted", False, False),
        ("ollanet_show", "Show model metadata from an Ollama host", "read", "none", "unrestricted", False, True),
        ("ollanet_rm", "Remove a model from an Ollama host", "destructive", "none", "unrestricted", False, False),
        ("ollanet_ps", "List models currently loaded on an Ollama host", "read", "none", "unrestricted", False, True),
        ("ollanet_list_chats", "List locally saved chat transcripts", "read", "scoped", "none", False, True),
        ("ollanet_get_chat", "Load one locally saved chat transcript by id", "read", "scoped", "none", False, True),
    ]
    write_tool_facts(
        dests=[
            Path("z:/workspace/ollanet/TOOL_FACTS.md"),
            Path("z:/workspace/tool-facts/examples/ollanet-mcp/TOOL_FACTS.md"),
            Path("z:/workspace/tool-facts/site/examples/ollanet-mcp/TOOL_FACTS.md"),
        ],
        name="ollanet MCP Server",
        version="0.6.6",
        homepage="https://ollanet.dev",
        repository="https://github.com/Catalyst-Forge-LLC/ollanet",
        tools=ol_tools,
        note="tools inventory from ollanet mcp 0.6.6",
    )

    # dictawhisper MCP (real read-only journal server)
    dw_tools = [
        ("dictawhisper_search", "Search voice notes by words, tags, or filename; returns paths, dates, tags, and a short preview", "read", "scoped", "none", False, True),
        ("dictawhisper_get_note", "Fetch one note by sidecar path or unique basename; returns cleaned text and tags", "read", "scoped", "none", False, True),
        ("dictawhisper_list_tags", "List tags in the journal with counts", "read", "scoped", "none", False, True),
        ("dictawhisper_recent", "List newest notes first with optional tag and day range filters", "read", "scoped", "none", False, True),
    ]
    write_tool_facts(
        dests=[
            Path("z:/workspace/dictawhisper/TOOL_FACTS.md"),
            Path("z:/workspace/tool-facts/examples/dictawhisper-mcp/TOOL_FACTS.md"),
            Path("z:/workspace/tool-facts/site/examples/dictawhisper-mcp/TOOL_FACTS.md"),
        ],
        name="DictaWhisper MCP Server",
        version="0.0.3",
        homepage="https://dictawhisper.com",
        repository="https://github.com/Catalyst-Forge-LLC/dictawhisper",
        tools=dw_tools,
        note="tools inventory from dictawhisper mcp (read-only journal)",
    )

    # TemperPass x4
    temper = [
        ("clarify-first", "Surface load-bearing assumptions and missing information, then answer under stated assumptions", "0.1.0"),
        ("red-team", "Attack a proposal for failure modes, incentives, and missing constraints before commitment", "0.1.0"),
        ("scope-lock", "Lock the in-scope and out-of-scope boundary for a piece of work before expanding it", "0.1.0"),
        ("tradeoff-matrix", "Force an explicit tradeoff matrix when choosing among mutually exclusive options", "0.1.0"),
    ]
    # versions from package if present
    tp_ver = "0.1.0"
    tp_pkg = Path("z:/workspace/temper-pass/package.json")
    if tp_pkg.exists():
        import json

        tp_ver = str(json.loads(tp_pkg.read_text(encoding="utf-8")).get("version") or tp_ver)
    for slug, purpose, _ in temper:
        write_skill_facts(
            dests=[
                Path(f"z:/workspace/temper-pass/passes/{slug}/SKILL_FACTS.md"),
                Path(f"z:/workspace/skill-facts/examples/temper-pass-{slug}/SKILL_FACTS.md"),
                Path(f"z:/workspace/skill-facts/site/examples/temper-pass-{slug}/SKILL_FACTS.md"),
            ],
            name=slug,
            version=tp_ver,
            purpose=purpose,
            kind="cursor-skill",
            homepage="https://temperpass.dev",
            repository="https://github.com/Catalyst-Forge-LLC/temper-pass",
            shell="none",
            network="none",
            filesystem="none",
            tools_referenced=[],
            body_note="*Instruction-only TemperPass. No bundled scripts; no shell/network/fs reach claimed.*",
        )

    # Smell Check
    ab_ver = "0.2.0"
    ab_pkg = Path("z:/workspace/smellcheck/package.json")
    if ab_pkg.exists():
        import json

        ab_ver = str(json.loads(ab_pkg.read_text(encoding="utf-8")).get("version") or ab_ver)
    write_skill_facts(
        dests=[
            Path("z:/workspace/smellcheck/skills/smellcheck/SKILL_FACTS.md"),
            Path("z:/workspace/skill-facts/examples/smellcheck/SKILL_FACTS.md"),
            Path("z:/workspace/skill-facts/site/examples/smellcheck/SKILL_FACTS.md"),
        ],
        name="smellcheck",
        version=ab_ver,
        purpose="Editorial rules for publishable prose; spray, audit, and publish-pass workflows for AI-assisted writing",
        kind="cursor-skill",
        homepage="https://smellcheck.dev",
        repository="https://github.com/Catalyst-Forge-LLC/smellcheck",
        shell="none",
        network="implied",
        filesystem="read",
        tools_referenced=[],
        bundled=[
            ("rules/core.md", "rules"),
            ("rules/audit.md", "rules"),
            ("rules/claims.md", "rules"),
        ],
        body_note="*May fetch published rule files from smellcheck.dev as a last resort; otherwise reads local rules/.*",
    )

    # EmberDossier
    ed_ver = "0.1.0"
    ed_pkg = Path("z:/workspace/ember-dossier/package.json")
    if ed_pkg.exists():
        import json

        ed_ver = str(json.loads(ed_pkg.read_text(encoding="utf-8")).get("version") or ed_ver)
    write_skill_facts(
        dests=[
            Path("z:/workspace/ember-dossier/skills/ember-dossier/SKILL_FACTS.md"),
            Path("z:/workspace/skill-facts/examples/ember-dossier/SKILL_FACTS.md"),
            Path("z:/workspace/skill-facts/site/examples/ember-dossier/SKILL_FACTS.md"),
        ],
        name="ember-dossier",
        version=ed_ver,
        purpose="Create a current, comprehensive, neutral briefing that leads with recency (living dossier format)",
        kind="cursor-skill",
        homepage="https://emberdossier.com",
        repository="https://github.com/Catalyst-Forge-LLC/ember-dossier",
        shell="none",
        network="implied",
        filesystem="none",
        tools_referenced=[],
        body_note="*Format skill; instructs the host to use search/tools for facts newer than training data.*",
    )

    # Docupuncture x3
    doc_ver = "0.1.0"
    doc_pkg = Path("z:/workspace/docupuncture/package.json")
    if doc_pkg.exists():
        import json

        doc_ver = str(json.loads(doc_pkg.read_text(encoding="utf-8")).get("version") or doc_ver)
    for slug, purpose in [
        ("docupuncture-docs", "Precise in-place edits to an existing Google Doc via paste-and-run Apps Script"),
        ("docupuncture-sheets", "Precise in-place edits to an existing Google Sheet via paste-and-run Apps Script"),
        ("docupuncture-slides", "Precise in-place edits to an existing Google Slides deck via paste-and-run Apps Script"),
    ]:
        write_skill_facts(
            dests=[
                Path(f"z:/workspace/docupuncture/skills/{slug}/SKILL_FACTS.md"),
                Path(f"z:/workspace/skill-facts/examples/{slug}/SKILL_FACTS.md"),
                Path(f"z:/workspace/skill-facts/site/examples/{slug}/SKILL_FACTS.md"),
            ],
            name=slug,
            version=doc_ver,
            purpose=purpose,
            kind="cursor-skill",
            homepage="https://docupuncture.dev",
            repository="https://github.com/Catalyst-Forge-LLC/docupuncture",
            shell="none",
            network="implied",
            filesystem="none",
            tools_referenced=["Google Drive MCP read_file_content"],
            body_note="*Teaches Apps Script patches the user runs in Google Workspace; host MCP may read Drive content.*",
        )

    # polish forgetrail APP_FACTS homepage
    p = Path("z:/workspace/forgetrail/APP_FACTS.md")
    if p.exists():
        t = p.read_text(encoding="utf-8")
        parts = t.split("---")
        if len(parts) >= 3 and "homepage:" not in parts[1]:
            t = t.replace("license: Apache-2.0\n", "license: Apache-2.0\nhomepage: https://forgetrail.dev\n", 1)
            if "forgetrail.dev" not in t.split("---", 2)[2]:
                t = t.replace(
                    "[Repository](https://github.com/Catalyst-Forge-LLC/forgetrail)",
                    "[Homepage](https://forgetrail.dev) · [Repository](https://github.com/Catalyst-Forge-LLC/forgetrail)",
                )
            p.write_text(t, encoding="utf-8", newline="\n")
            print("polished forgetrail APP_FACTS homepage")


if __name__ == "__main__":
    main()
