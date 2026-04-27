import { todayKey } from "./time";

export type UsageCategory = "work" | "distraction" | "neutral" | "idle";

export type DomainUsage = {
  domain: string;
  seconds: number;
  category: UsageCategory;
};

export type DailyStats = {
  date: string;
  workSeconds: number;
  distractionSeconds: number;
  neutralSeconds: number;
  idleSeconds: number;
  blockedAttempts: number;
  domains: Record<string, DomainUsage>;
};

export type FocusSession = {
  active: boolean;
  startedAt: number | null;
  durationMinutes: number;
  goal: string;
};

export type LastFocusSession = {
  goal: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
};

export type GoalItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

export type AssignmentItem = {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  completed: boolean;
};

const DEFAULT_SESSION: FocusSession = {
  active: false,
  startedAt: null,
  durationMinutes: 45,
  goal: "Engineering deep work",
};

export async function getDailyStats(): Promise<DailyStats> {
  const key = `stats:${todayKey()}`;

  const result = (await chrome.storage.local.get(key)) as Record<
    string,
    DailyStats | undefined
  >;

  if (result[key]) return result[key] as DailyStats;

  const empty: DailyStats = {
    date: todayKey(),
    workSeconds: 0,
    distractionSeconds: 0,
    neutralSeconds: 0,
    idleSeconds: 0,
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
  const result = (await chrome.storage.local.get("focusSession")) as {
    focusSession?: FocusSession;
  };

  return result.focusSession ?? DEFAULT_SESSION;
}

export async function saveFocusSession(session: FocusSession) {
  await chrome.storage.local.set({ focusSession: session });
}

export async function getLastFocusSession(): Promise<LastFocusSession | null> {
  const result = (await chrome.storage.local.get("lastFocusSession")) as {
    lastFocusSession?: LastFocusSession;
  };

  return result.lastFocusSession ?? null;
}

export async function saveLastFocusSession(session: LastFocusSession) {
  await chrome.storage.local.set({ lastFocusSession: session });
}

export async function getGoals(): Promise<GoalItem[]> {
  const result = (await chrome.storage.local.get("goals")) as {
    goals?: GoalItem[];
  };

  return result.goals ?? [];
}

export async function saveGoals(goals: GoalItem[]) {
  await chrome.storage.local.set({ goals });
}

export async function getAssignments(): Promise<AssignmentItem[]> {
  const result = (await chrome.storage.local.get("assignments")) as {
    assignments?: AssignmentItem[];
  };

  return result.assignments ?? [];
}

export async function saveAssignments(assignments: AssignmentItem[]) {
  await chrome.storage.local.set({ assignments });
}

export async function clearToday() {
  await chrome.storage.local.remove(`stats:${todayKey()}`);
}