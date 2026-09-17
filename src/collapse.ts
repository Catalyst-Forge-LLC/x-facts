import { harshness } from "./spec.ts";

/** Conservative collapse: harshest stated value, or undisclosed if any tool was silent. */
export function collapseStated<T>(
  key: string,
  stated: T[],
  silent: boolean,
  harshest: T,
): T | "undisclosed" {
  if (stated.length === 0) return "undisclosed";
  let worst = stated[0];
  for (const v of stated.slice(1)) {
    if (harshness(key, v) > harshness(key, worst)) worst = v;
  }
  if (silent && worst !== harshest) return "undisclosed";
  return worst;
}
