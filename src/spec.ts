import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Severity } from "./types.ts";

const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(here, "..");
export const SPECS = resolve(REPO_ROOT, "specs");

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export interface EnumKey {
  label: string;
  members: Array<string | boolean> | null;
  harsher?: Array<string | boolean>;
}

export interface EnumsDoc {
  keys: Record<string, EnumKey>;
}

export interface SeverityDoc {
  undisclosed: Severity;
  by_key: Record<string, Record<string, Severity>>;
}

export const enums = readJson<EnumsDoc>(resolve(SPECS, "enums.json"));
export const severityDoc = readJson<SeverityDoc>(resolve(SPECS, "severity.json"));
export const panelSchema = readJson<Record<string, unknown>>(resolve(SPECS, "panel.schema.json"));

export function rowLabel(key: string): string {
  return enums.keys[key]?.label ?? key;
}

export function severityFor(key: string, value: unknown): Severity {
  if (value === "undisclosed") return severityDoc.undisclosed;
  const table = severityDoc.by_key[key] ?? {};
  const asKey = String(value);
  if (table[asKey]) return table[asKey];
  if (table["*"]) return table["*"];
  return "info";
}

/** Higher number = harsher. undisclosed is treated as the top of the scale. */
export function harshness(key: string, value: unknown): number {
  if (value === "undisclosed") return 100;
  const order = enums.keys[key]?.harsher;
  if (!order) return 0;
  const i = order.findIndex((m) => m === value || String(m) === String(value));
  return i === -1 ? 0 : i;
}

export const TOOL_KEYS = Object.keys(enums.keys);
