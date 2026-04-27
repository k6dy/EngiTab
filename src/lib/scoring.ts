import type { DailyStats } from "./storage";

export function calculateFocusScore(stats: DailyStats) {
  const total =
    stats.workSeconds +
    stats.distractionSeconds +
    stats.neutralSeconds +
    stats.idleSeconds;

  if (total <= 0) return 100;

  const raw =
    ((stats.workSeconds * 1.2 -
      stats.distractionSeconds * 1.5 -
      stats.idleSeconds * 0.25) /
      total) *
    100;

  return Math.max(0, Math.min(100, Math.round(raw)));
}