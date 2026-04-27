import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Check,
  Circle,
  Clock,
  Code2,
  ExternalLink,
  Focus,
  Plus,
  Power,
  RotateCcw,
  ShieldAlert,
  SquareCheck,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react";
import { calculateFocusScore } from "./lib/scoring";
import {
  clearToday,
  getAssignments,
  getDailyStats,
  getFocusSession,
  getGoals,
  getLastFocusSession,
  saveAssignments,
  saveFocusSession,
  saveGoals,
  saveLastFocusSession,
} from "./lib/storage";
import type {
  AssignmentItem,
  DailyStats,
  FocusSession,
  GoalItem,
  LastFocusSession,
} from "./lib/storage";
import { QUICK_LINKS, TOOL_LABELS } from "./data/defaultSites";
import { formatMinutes } from "./lib/time";
import "./styles.css";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatTimerFromSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function formatActiveTimer(startedAt: number | null) {
  if (!startedAt) return "00:00";
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  return formatTimerFromSeconds(seconds);
}

export default function App() {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [lastSession, setLastSession] = useState<LastFocusSession | null>(null);
  const [timerDisplay, setTimerDisplay] = useState("00:00");

  const [goal, setGoal] = useState("Engineering deep work");
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [newGoal, setNewGoal] = useState("");

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState("");
  const [newAssignmentCourse, setNewAssignmentCourse] = useState("");
  const [newAssignmentDue, setNewAssignmentDue] = useState("");

  async function refresh() {
    const [
      dailyStats,
      focusSession,
      storedGoals,
      storedAssignments,
      storedLastSession,
    ] = await Promise.all([
      getDailyStats(),
      getFocusSession(),
      getGoals(),
      getAssignments(),
      getLastFocusSession(),
    ]);

    setStats(dailyStats);
    setSession(focusSession);
    setGoal(focusSession.goal);
    setGoals(storedGoals);
    setAssignments(storedAssignments);
    setLastSession(storedLastSession);
  }

  useEffect(() => {
    refresh();

    const refreshInterval = window.setInterval(() => {
      refresh();
    }, 5000);

    return () => window.clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    const timerInterval = window.setInterval(() => {
      setTimerDisplay(formatActiveTimer(session?.startedAt ?? null));
    }, 1000);

    return () => window.clearInterval(timerInterval);
  }, [session]);

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
    setTimerDisplay("00:00");
  }

  async function stopFocus() {
    const now = Date.now();
    const startedAt = session?.startedAt ?? now;
    const durationSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));

    const completedSession: LastFocusSession = {
      goal,
      startedAt,
      endedAt: now,
      durationSeconds,
    };

    const updated: FocusSession = {
      active: false,
      startedAt: null,
      durationMinutes: 45,
      goal,
    };

    await saveLastFocusSession(completedSession);
    await saveFocusSession(updated);

    setLastSession(completedSession);
    setSession(updated);
    setTimerDisplay("00:00");
  }

  async function resetToday() {
    await clearToday();
    await refresh();
  }

  async function addGoal() {
    if (!newGoal.trim()) return;

    const updated: GoalItem[] = [
      {
        id: crypto.randomUUID(),
        text: newGoal.trim(),
        completed: false,
        createdAt: Date.now(),
      },
      ...goals,
    ];

    setGoals(updated);
    setNewGoal("");
    await saveGoals(updated);
  }

  async function toggleGoal(id: string) {
    const updated = goals.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );

    setGoals(updated);
    await saveGoals(updated);
  }

  async function deleteGoal(id: string) {
    const updated = goals.filter((item) => item.id !== id);
    setGoals(updated);
    await saveGoals(updated);
  }

  async function addAssignment() {
    if (!newAssignmentTitle.trim()) return;

    const updated: AssignmentItem[] = [
      {
        id: crypto.randomUUID(),
        title: newAssignmentTitle.trim(),
        course: newAssignmentCourse.trim() || "Canvas",
        dueDate: newAssignmentDue,
        completed: false,
      },
      ...assignments,
    ];

    setAssignments(updated);
    setNewAssignmentTitle("");
    setNewAssignmentCourse("");
    setNewAssignmentDue("");
    await saveAssignments(updated);
  }

  async function toggleAssignment(id: string) {
    const updated = assignments.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );

    setAssignments(updated);
    await saveAssignments(updated);
  }

  async function deleteAssignment(id: string) {
    const updated = assignments.filter((item) => item.id !== id);
    setAssignments(updated);
    await saveAssignments(updated);
  }

  return (
    <main className="min-h-screen px-6 py-8 text-violet-50">
      <section className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-violet-500/10 pb-5">
          <div className="flex items-center gap-2">
            <Terminal className="text-violet-300" size={20} />
            <span className="font-black tracking-tight">EngiTab</span>
          </div>

          <div className="text-xs uppercase tracking-[0.25em] text-neutral-500">
            {session?.active ? "FOCUS_ACTIVE" : "READY"}
          </div>
        </header>

        <section className="mt-10 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-violet-400">
            Engineering Focus Console
          </p>

          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-7xl">
            {getGreeting()}, engineer.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-8 text-neutral-400">
            A clean command center for coursework, technical tools, focus
            sessions, and daily productivity signals.
          </p>
        </section>

        <section className="mx-auto mt-10 max-w-4xl rounded-[2rem] border border-violet-500/25 bg-[#10101d]/80 p-5 shadow-2xl shadow-black/30">
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-violet-500/20 bg-[#090711] px-4 py-3 text-left">
            <span className="text-violet-300">→</span>
            <span className="text-neutral-500">quick launch...</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
            {QUICK_LINKS.slice(0, 10).map((link) => (
              <a
                key={link.url}
                href={link.url}
                className="group rounded-2xl border border-violet-500/10 bg-white/[0.045] p-4 text-left transition hover:-translate-y-1 hover:border-violet-400/50 hover:bg-violet-500/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15 text-sm font-black text-violet-200">
                    {link.short}
                  </div>
                  <ExternalLink
                    size={15}
                    className="text-neutral-500 transition group-hover:text-violet-300"
                  />
                </div>

                <p className="mt-3 font-black text-violet-50">{link.label}</p>
                <p className="mt-1 text-xs text-neutral-500">{link.hint}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-5">
          <Metric icon={<Activity />} label="Focus Score" value={`${focusScore}%`} />
          <Metric icon={<Code2 />} label="Work" value={formatMinutes(stats?.workSeconds ?? 0)} />
          <Metric
            icon={<ShieldAlert />}
            label="Distraction"
            value={formatMinutes(stats?.distractionSeconds ?? 0)}
          />
          <Metric icon={<Clock />} label="Idle" value={formatMinutes(stats?.idleSeconds ?? 0)} />
          <Metric icon={<Zap />} label="Active" value={session?.active ? timerDisplay : "00:00"} />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="terminal-card rounded-3xl p-6">
            <div className="flex items-center gap-2">
              <Focus className="text-violet-300" />
              <h2 className="text-2xl font-black">Focus Session</h2>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-bold text-neutral-300">
                Current goal
              </span>
              <input
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-violet-500/20 bg-[#100d1c] p-4 outline-none focus:border-violet-400"
              />
            </label>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <TimerPanel
                label="Active Timer"
                value={session?.active ? timerDisplay : "00:00"}
              />
              <TimerPanel
                label="Last Session"
                value={
                  lastSession
                    ? formatTimerFromSeconds(lastSession.durationSeconds)
                    : "00:00"
                }
              />
            </div>

            <div className="mt-5">
              {session?.active ? (
                <button
                  onClick={stopFocus}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 font-black text-red-300 transition hover:bg-red-500/20"
                >
                  <Power size={18} />
                  Stop Focus
                </button>
              ) : (
                <button
                  onClick={startFocus}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 font-black transition hover:bg-violet-500"
                >
                  <Power size={18} />
                  Start Focus
                </button>
              )}
            </div>

            <button
              onClick={resetToday}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-700 px-5 py-4 font-black text-neutral-300 transition hover:bg-white/5"
            >
              <RotateCcw size={18} />
              Reset Today’s Stats
            </button>
          </div>

          <div className="terminal-card rounded-3xl p-6">
            <h2 className="text-2xl font-black">Usage Breakdown</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <UsageBlock label="Work" value={formatMinutes(stats?.workSeconds ?? 0)} />
              <UsageBlock
                label="Distraction"
                value={formatMinutes(stats?.distractionSeconds ?? 0)}
              />
              <UsageBlock label="Idle" value={formatMinutes(stats?.idleSeconds ?? 0)} />
            </div>

            <div className="mt-6">
              <h3 className="font-black text-violet-100">Top Domains</h3>

              <div className="mt-4 space-y-3">
                {topDomains.length === 0 ? (
                  <p className="text-sm text-neutral-400">
                    Browse normally and tracked usage will appear here.
                  </p>
                ) : (
                  topDomains.map((domain) => (
                    <div
                      key={domain.domain}
                      className="flex items-center justify-between rounded-2xl bg-[#100d1c] p-4"
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
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="terminal-card rounded-3xl p-6">
            <div className="mb-5 flex items-center gap-2">
              <SquareCheck className="text-violet-300" />
              <h2 className="text-2xl font-black">Goals</h2>
            </div>

            <div className="flex gap-3">
              <input
                value={newGoal}
                onChange={(event) => setNewGoal(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addGoal();
                }}
                placeholder="finish MATLAB lab..."
                className="w-full rounded-2xl border border-violet-500/20 bg-[#100d1c] p-4 outline-none focus:border-violet-400"
              />
              <button
                onClick={addGoal}
                className="flex items-center justify-center rounded-2xl bg-violet-600 px-5 font-black transition hover:bg-violet-500"
              >
                <Plus />
              </button>
            </div>

            <div className="mt-5 max-h-72 space-y-3 overflow-auto no-scrollbar">
              {goals.length === 0 ? (
                <p className="text-sm text-neutral-400">
                  Saved goals persist across new tabs.
                </p>
              ) : (
                goals.map((goalItem) => (
                  <TaskRow
                    key={goalItem.id}
                    text={goalItem.text}
                    completed={goalItem.completed}
                    onToggle={() => toggleGoal(goalItem.id)}
                    onDelete={() => deleteGoal(goalItem.id)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="terminal-card rounded-3xl p-6">
            <div className="mb-5 flex items-center gap-2">
              <Clock className="text-violet-300" />
              <h2 className="text-2xl font-black">Canvas Queue</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_0.7fr_0.55fr_auto]">
              <input
                value={newAssignmentTitle}
                onChange={(event) => setNewAssignmentTitle(event.target.value)}
                placeholder="assignment"
                className="rounded-2xl border border-violet-500/20 bg-[#100d1c] p-4 outline-none focus:border-violet-400"
              />
              <input
                value={newAssignmentCourse}
                onChange={(event) => setNewAssignmentCourse(event.target.value)}
                placeholder="course"
                className="rounded-2xl border border-violet-500/20 bg-[#100d1c] p-4 outline-none focus:border-violet-400"
              />
              <input
                type="date"
                value={newAssignmentDue}
                onChange={(event) => setNewAssignmentDue(event.target.value)}
                className="rounded-2xl border border-violet-500/20 bg-[#100d1c] p-4 outline-none focus:border-violet-400"
              />
              <button
                onClick={addAssignment}
                className="flex items-center justify-center rounded-2xl bg-violet-600 px-5 font-black transition hover:bg-violet-500"
              >
                <Plus />
              </button>
            </div>

            <div className="mt-5 max-h-72 space-y-3 overflow-auto no-scrollbar">
              {assignments.length === 0 ? (
                <p className="text-sm text-neutral-400">
                  Canvas API sync comes next. For now, add important tasks here.
                </p>
              ) : (
                assignments.map((assignment) => (
                  <AssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    onToggle={() => toggleAssignment(assignment.id)}
                    onDelete={() => deleteAssignment(assignment.id)}
                  />
                ))
              )}
            </div>
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
  icon: React.ReactNode;
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

function TimerPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-violet-500/10 bg-[#100d1c] p-5 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-4xl font-black text-violet-200">{value}</p>
    </div>
  );
}

function UsageBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-violet-500/10 bg-[#100d1c] p-4">
      <p className="text-xs uppercase tracking-widest text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-black text-violet-200">{value}</p>
    </div>
  );
}

function TaskRow({
  text,
  completed,
  onToggle,
  onDelete,
}: {
  text: string;
  completed: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#100d1c] p-4">
      <button onClick={onToggle} className="flex items-center gap-3 text-left">
        {completed ? (
          <Check className="text-green-300" size={18} />
        ) : (
          <Circle className="text-neutral-500" size={18} />
        )}

        <span className={completed ? "text-neutral-500 line-through" : ""}>
          {text}
        </span>
      </button>

      <button onClick={onDelete} className="text-neutral-500 hover:text-red-300">
        <Trash2 size={17} />
      </button>
    </div>
  );
}

function AssignmentRow({
  assignment,
  onToggle,
  onDelete,
}: {
  assignment: AssignmentItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#100d1c] p-4">
      <button onClick={onToggle} className="flex items-center gap-3 text-left">
        {assignment.completed ? (
          <Check className="text-green-300" size={18} />
        ) : (
          <Circle className="text-neutral-500" size={18} />
        )}

        <div>
          <p
            className={
              assignment.completed ? "text-neutral-500 line-through" : "font-black"
            }
          >
            {assignment.title}
          </p>
          <p className="text-xs text-neutral-500">
            {assignment.course}
            {assignment.dueDate ? ` · due ${assignment.dueDate}` : ""}
          </p>
        </div>
      </button>

      <button onClick={onDelete} className="text-neutral-500 hover:text-red-300">
        <Trash2 size={17} />
      </button>
    </div>
  );
}