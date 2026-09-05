import { deflateSync, inflateSync } from "node:zlib";
import type { Panel } from "./types.ts";

export const VIEWER_PREFIX = "pn1.";

export function encodePanelHash(panel: Panel): string {
  const raw = JSON.stringify(panel);
  const compressed = deflateSync(Buffer.from(raw, "utf8"), { level: 9 });
  return VIEWER_PREFIX + compressed.toString("base64url");
}

export function decodePanelHash(hash: string): Panel {
  const raw = hash.replace(/^#/, "");
  if (!raw.startsWith(VIEWER_PREFIX)) {
    throw new Error(`unsupported panel fragment (want ${VIEWER_PREFIX})`);
  }
  const json = inflateSync(Buffer.from(raw.slice(VIEWER_PREFIX.length), "base64url")).toString("utf8");
  return JSON.parse(json) as Panel;
}

export function viewerUrl(panel: Panel, origin = "https://xfacts.dev"): string {
  return `${origin}/v#${encodePanelHash(panel)}`;
}
