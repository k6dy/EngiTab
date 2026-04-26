export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function formatMinutes(seconds: number) {
  const minutes = Math.round(seconds / 60);

  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return `${hours}h ${remaining}m`;
}