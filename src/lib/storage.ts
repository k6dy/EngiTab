import { todayKey } from "./time";

export type DomainUsage = {
  domain: string;
  seconds: number;
  category: "productive" | "distracting" | "neutral";
};

export type DailyStats = {
  date: string;
  productiveSeconds: number;
  distractingSeconds: number;
  neutralSeconds: number;
  blockedAttempts: number;
  domains: Record<string, DomainUsage>;
};

export type FocusSession = {
  active: boolean;
  startedAt: number | null;
  durationMinutes: number;
  goal: string;
};

const DEFAULT_SESSION: FocusSession = {
  active: false,
  startedAt: null,
  durationMinutes: 45,
  goal: "Engineering deep work",
};

export async function getDailyStats(): Promise<DailyStats> {
  const key = `stats:${todayKey()}`;

  const result = await chrome.storage.local.get(key);

  if (result[key]) return result[key] as DailyStats;

  const empty: DailyStats = {
    date: todayKey(),
    productiveSeconds: 0,
    distractingSeconds: 0,
    neutralSeconds: 0,
    blockedAttempts: 0,
    domains: {},
  };

  await chrome.storage.local.set({ [key]: empty });

  return empty;
}

export async function saveDailyStats(stats: DailyStats) {
  await chrome.storage.local.set({
    [`stats:${todayKey()}`]: stats,
  });
}

export async function getFocusSession(): Promise<FocusSession> {
  const result = await chrome.storage.local.get("focusSession");

  return (result.focusSession as FocusSession) ?? DEFAULT_SESSION;
}

export async function saveFocusSession(session: FocusSession) {
  await chrome.storage.local.set({ focusSession: session });
}

export async function clearToday() {
  await chrome.storage.local.remove(`stats:${todayKey()}`);
}