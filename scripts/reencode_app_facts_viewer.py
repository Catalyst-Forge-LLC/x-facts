#!/usr/bin/env python3
"""Thin wrapper. Prefer reencode_facts_viewer.py (app, tool, and skill)."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from reencode_facts_viewer import reencode


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: reencode_app_facts_viewer.py APP_FACTS.md")
    path = Path(sys.argv[1])
    url, wrote = reencode(path)
    verb = "reencoded" if wrote else "unchanged"
    print(f"{verb} {path} -> {url[:80]}...")


if __name__ == "__main__":
    main()
