import { DISTRACTING_SITES, PRODUCTIVE_SITES } from "../data/defaultSites";
import type { UsageCategory } from "./storage";

export function getDomain(url?: string) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function includesDomain(domain: string, list: string[]) {
  return list.some((item) => domain === item || domain.endsWith(`.${item}`));
}

export function categorizeDomain(domain: string): UsageCategory {
  if (!domain) return "idle";
  if (includesDomain(domain, PRODUCTIVE_SITES)) return "work";
  if (includesDomain(domain, DISTRACTING_SITES)) return "distraction";
  return "neutral";
}