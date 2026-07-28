# Rajzik Dark — Python syntax sample

"""Validates theme scope coverage across example files."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from enum import Enum, auto
from pathlib import Path
from typing import Any


class ScopeCategory(Enum):
    COMMENT = auto()
    KEYWORD = auto()
    TYPE = auto()
    STRING = auto()


@dataclass(frozen=True)
class ScopeCheck:
    pattern: str
    category: ScopeCategory
    required: bool = True


# Dict keys — meta.structure.dictionary.key.python
THEME_CONFIG: dict[str, Any] = {
    "name": "rajzik-dark",
    "semantic_highlighting": True,
    "max_retries": 3,
    "colors": {
        "editor.background": "#181818",
        "editor.foreground": "#E4E4E4EB",
    },
}

HEX_PATTERN = re.compile(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
EMAIL_PATTERN = re.compile(r"^[\w.+-]+@[\w.-]+\.[a-z]{2,}$", re.IGNORECASE)


def load_json(path: Path) -> dict[str, Any]:
    """Load and parse a JSON file."""
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def validate_color(value: str) -> bool:
    # Logical operators — keyword.operator.logical.python
    if not value or not isinstance(value, str):
        return False

    return bool(HEX_PATTERN.match(value)) and len(value) in (4, 7)


def classify_files(directory: Path) -> list[str]:
    """Return paths that look like syntax examples."""
    extensions = {".py", ".ts", ".js", ".html", ".css"}
    results: list[str] = []

    for path in directory.iterdir():
        if path.suffix in extensions and path.is_file():
            results.append(str(path))

    return sorted(results)


class ThemeAuditor:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.checks = [
            ScopeCheck(r"\bcomment\b", ScopeCategory.COMMENT),
            ScopeCheck(r"\bkeyword\b", ScopeCategory.KEYWORD),
        ]

    def run(self) -> dict[str, bool]:
        config = THEME_CONFIG
        bg = config["colors"]["editor.background"]

        return {
            "valid_bg": validate_color(bg),
            "file_count": len(classify_files(self.root)) > 0,
            "has_name": config.get("name") == "rajzik-dark",
        }


if __name__ == "__main__":
    auditor = ThemeAuditor(Path(__file__).parent)
    report = auditor.run()
    print(f"Audit complete: {report}")
