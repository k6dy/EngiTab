import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  Clock,
  Code2,
  Focus,
  Power,
  RotateCcw,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { calculateFocusScore } from "./lib/scoring";
import {
  clearToday,
  type DailyStats,
  type FocusSession,
  getDailyStats,
  getFocusSession,
  saveFocusSession,
} from "./lib/storage";
import { formatMinutes } from "./lib/time";
import { TOOL_LABELS } from "./data/defaultSites";

export default function App() {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [goal, setGoal] = useState("Engineering deep work");

  async function refresh() {
    const [dailyStats, focusSession] = await Promise.all([
      getDailyStats(),
      getFocusSession(),
    ]);

    setStats(dailyStats);
    setSession(focusSession);
    setGoal(focusSession.goal);
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  const focusScore = useMemo(() => {
    if (!stats) return 100;
    return calculateFocusScore(stats);
  }, [stats]);

  const topDomains = useMemo(() => {
    if (!stats) return [];

    return Object.values(stats.domains)
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 5);
  }, [stats]);

  async function startFocus() {
    const updated: FocusSession = {
      active: true,
      startedAt: Date.now(),
      durationMinutes: 45,
      goal,
    };

    await saveFocusSession(updated);
    setSession(updated);
  }

  async function stopFocus() {
    const updated: FocusSession = {
      active: false,
      startedAt: null,
      durationMinutes: 45,
      goal,
    };

    await saveFocusSession(updated);
    setSession(updated);
  }

  async function resetToday() {
    await clearToday();
    await refresh();
  }

  return (
    <main className="min-h-screen px-6 py-8 text-violet-50">
      <section className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-violet-500/20 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.35em] text-violet-400">
              <Terminal size={18} />
              EngiTab
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">
              Focus console for engineering work.
            </h1>

            <p className="mt-4 max-w-3xl leading-8 text-neutral-400">
              Track engineering tool usage, protect deep work sessions, and turn
              every new tab into a productivity cockpit.
            </p>
          </div>

          <div className="terminal-card rounded-3xl p-5">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Mode
            </p>
            <p className="mt-1 text-xl font-black text-violet-300">
              {session?.active ? "FOCUS_ACTIVE" : "READY"}
            </p>
          </div>
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          <Metric icon={<Activity />} label="Focus Score" value={`${focusScore}%`} />
          <Metric
            icon={<Code2 />}
            label="Engineering Time"
            value={formatMinutes(stats?.productiveSeconds ?? 0)}
          />
          <Metric
            icon={<ShieldAlert />}
            label="Distraction Time"
            value={formatMinutes(stats?.distractingSeconds ?? 0)}
          />
          <Metric
            icon={<Focus />}
            label="Blocked Attempts"
            value={String(stats?.blockedAttempts ?? 0)}
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="terminal-card rounded-3xl p-6">
            <h2 className="text-2xl font-black">Focus Session</h2>

            <p className="mt-3 text-sm leading-7 text-neutral-400">
              Start a focused engineering block. Distracting sites will be
              intercepted with a friction screen.
            </p>

            <label className="mt-6 block">
              <span className="text-sm font-bold text-neutral-300">
                Current Goal
              </span>
              <input
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-violet-500/20 bg-[#100d1c] p-4 font-mono outline-none focus:border-violet-400"
              />
            </label>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                onClick={startFocus}
                className="flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 font-black transition hover:bg-violet-500"
              >
                <Power size={18} />
                Start Focus
              </button>

              <button
                onClick={stopFocus}
                className="rounded-2xl border border-violet-500/40 px-5 py-4 font-black text-violet-200 transition hover:bg-violet-500/10"
              >
                Stop
              </button>
            </div>

            <button
              onClick={resetToday}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-700 px-5 py-4 font-black text-neutral-300 transition hover:bg-white/5"
            >
              <RotateCcw size={18} />
              Reset Today
            </button>
          </div>

          <div className="terminal-card rounded-3xl p-6">
            <h2 className="text-2xl font-black">Top Domains Today</h2>

            <div className="mt-5 space-y-3">
              {topDomains.length === 0 ? (
                <p className="text-neutral-400">
                  Start browsing and EngiTab will build your daily usage profile.
                </p>
              ) : (
                topDomains.map((domain) => (
                  <div
                    key={domain.domain}
                    className="flex items-center justify-between rounded-2xl border border-violet-500/20 bg-[#100d1c] p-4"
                  >
                    <div>
                      <p className="font-black">
                        {TOOL_LABELS[domain.domain] ?? domain.domain}
                      </p>
                      <p className="text-xs uppercase tracking-widest text-neutral-500">
                        {domain.category}
                      </p>
                    </div>

                    <p className="font-black text-violet-300">
                      {formatMinutes(domain.seconds)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="terminal-card mt-8 rounded-3xl p-6">
          <div className="mb-5 flex items-center gap-2">
            <Clock className="text-violet-300" />
            <h2 className="text-2xl font-black">Engineering Tool Categories</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <CategoryCard
              title="Productive"
              description="Engineering tools, docs, coding platforms, Canvas, Microsoft 365, MATLAB, GitHub."
            />
            <CategoryCard
              title="Distracting"
              description="Entertainment and social platforms that interrupt focus sessions."
            />
            <CategoryCard
              title="Neutral"
              description="Everything else. Neutral domains are tracked but do not strongly affect your score."
            />
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="terminal-card rounded-3xl p-5">
      <div className="mb-4 text-violet-300">{icon}</div>
      <p className="text-xs uppercase tracking-widest text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function CategoryCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-[#100d1c] p-5">
      <p className="font-black text-violet-200">{title}</p>
      <p className="mt-2 text-sm leading-6 text-neutral-400">{description}</p>
    </div>
  );
}