import type { Panel, Severity } from "./types.ts";

const COLORS: Record<Severity, string> = {
  info: "#3b7d4f",
  caution: "#b8860b",
  danger: "#b42318",
};

export function worstSeverity(panel: Panel): Severity {
  const rank = { info: 0, caution: 1, danger: 2 };
  let worst: Severity = "info";
  for (const row of panel.rows) {
    if (rank[row.severity] > rank[worst]) worst = row.severity;
  }
  return worst;
}

export function badgeSvg(panel: Panel): string {
  const sev = worstSeverity(panel);
  const ver = panel.provenance.verification;
  const label = `${sev} · ${ver}`;
  const color = COLORS[sev];
  const width = 18 + label.length * 6.4;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(width)}" height="20" role="img" aria-label="xFacts Panel: ${label}">
  <title>xFacts Panel: ${label}</title>
  <rect width="${Math.ceil(width)}" height="20" fill="#101418"/>
  <rect x="0" y="0" width="48" height="20" fill="#243040"/>
  <text x="24" y="14" text-anchor="middle" fill="#c9d3de" font-family="ui-monospace, monospace" font-size="10">panel</text>
  <rect x="48" y="0" width="${Math.ceil(width) - 48}" height="20" fill="${color}"/>
  <text x="${48 + (Math.ceil(width) - 48) / 2}" y="14" text-anchor="middle" fill="#fff" font-family="ui-monospace, monospace" font-size="10">${label}</text>
</svg>
`;
}
