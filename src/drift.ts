import { harshness } from "./spec.ts";
import type { Panel, PanelRow } from "./types.ts";

export type DriftKind =
  | "row-added"
  | "row-removed"
  | "severity-increased"
  | "value-harsher"
  | "value-changed"
  | "identity-changed";

export interface DriftEvent {
  kind: DriftKind;
  key?: string;
  from?: unknown;
  to?: unknown;
}

function byKey(rows: PanelRow[]): Map<string, PanelRow> {
  return new Map(rows.map((r) => [r.key, r]));
}

function identityBlob(panel: Panel): string {
  return JSON.stringify(panel.subject_identity);
}

export function diffRows(approved: Panel, fresh: Panel): DriftEvent[] {
  const events: DriftEvent[] = [];
  const a = byKey(approved.rows);
  const b = byKey(fresh.rows);
  for (const key of a.keys()) {
    if (!b.has(key)) events.push({ kind: "row-removed", key, from: a.get(key)?.value });
  }
  for (const key of b.keys()) {
    if (!a.has(key)) events.push({ kind: "row-added", key, to: b.get(key)?.value });
  }
  for (const key of a.keys()) {
    const prev = a.get(key);
    const next = b.get(key);
    if (!prev || !next) continue;
    if (JSON.stringify(prev.value) === JSON.stringify(next.value) && prev.severity === next.severity) {
      continue;
    }
    if (next.severity !== prev.severity) {
      const rank = { info: 0, caution: 1, danger: 2 };
      if (rank[next.severity] > rank[prev.severity]) {
        events.push({
          kind: "severity-increased",
          key,
          from: prev.severity,
          to: next.severity,
        });
      }
    }
    if (JSON.stringify(prev.value) !== JSON.stringify(next.value)) {
      const harsher = harshness(key, next.value) > harshness(key, prev.value);
      events.push({
        kind: harsher ? "value-harsher" : "value-changed",
        key,
        from: prev.value,
        to: next.value,
      });
    }
  }
  if (identityBlob(approved) !== identityBlob(fresh)) {
    events.push({
      kind: "identity-changed",
      from: approved.subject_identity,
      to: fresh.subject_identity,
    });
  }
  return events;
}

export function isSeverityDrift(events: DriftEvent[]): boolean {
  return events.some((e) => e.kind === "severity-increased" || e.kind === "value-harsher");
}
