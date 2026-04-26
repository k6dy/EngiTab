import type { DailyStats } from "./storage";

export function calculateFocusScore(stats: DailyStats) {
  const productive = stats.productiveSeconds;
  const distracting = stats.distractingSeconds;
  const neutral = stats.neutralSeconds;

  const total = productive + distracting + neutral;

  if (total <= 0) return 100;

  const score = Math.round(
    ((productive * 1.15 - distracting * 1.35) / total) * 100
  );

  return Math.max(0, Math.min(100, score));
}