import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { isPast, isToday } from "date-fns";
import { useCreateReminder, useDeals, useReminders, useUpdateReminder } from "../hooks/queries";
import { useToast } from "../components/Toast";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { IconBell, IconCheck, IconClock, IconPlus } from "../components/icons";
import { formatRelativeDay } from "../lib/format";
import "../styles/reminders.css";

export function RemindersPage() {
  const remindersQuery = useReminders();
  const dealsQuery = useDeals();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const { show } = useToast();

  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [dealId, setDealId] = useState("");

  const reminders = remindersQuery.data ?? [];
  const openDeals = (dealsQuery.data ?? []).filter((d) => d.stage !== "won" && d.stage !== "lost");

  const groups = useMemo(() => {
    const overdue = [];
    const today = [];
    const upcoming = [];
    const done = [];
    for (const r of reminders) {
      const date = new Date(r.due_at);
      if (r.done) {
        done.push(r);
      } else if (isToday(date)) {
        today.push(r);
      } else if (isPast(date)) {
        overdue.push(r);
      } else {
        upcoming.push(r);
      }
    }
    const byDate = (a: { due_at: string }, b: { due_at: string }) =>
      new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    overdue.sort(byDate);
    upcoming.sort(byDate);
    done.sort((a, b) => byDate(b, a));
    return { overdue, today: today.sort(byDate), upcoming, done };
  }, [reminders]);

  async function toggle(id: number, done: boolean) {
    try {
      await updateReminder.mutateAsync({ id, patch: { done: !done } });
    } catch {
      show("Couldn't update that reminder", "danger");
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueAt) return;
    try {
      await createReminder.mutateAsync({
        title: title.trim(),
        dueAt: new Date(dueAt).toISOString(),
        dealId: dealId ? Number(dealId) : null,
      });
      show("Follow-up scheduled", "success");
      setTitle("");
      setDueAt("");
      setDealId("");
    } catch {
      show("Couldn't add that reminder", "danger");
    }
  }

  const loading = remindersQuery.isLoading;
  const isEmpty = !loading && reminders.length === 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Follow-ups</span>
          <h1>Reminders</h1>
          <p className="subtitle">Never let a warm conversation go cold.</p>
        </div>
      </div>

      <div className="reminders-layout">
        <div>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} width="100%" height={54} style={{ borderRadius: 14 }} />
              ))}
            </div>
          )}

          {isEmpty && (
            <EmptyState
              icon={<IconBell width={20} height={20} />}
              title="No reminders yet"
              description="Schedule a follow-up on the right so nothing slips through the cracks."
            />
          )}

          {!loading && !isEmpty && (
            <>
              <ReminderGroup title="Overdue" items={groups.overdue} onToggle={toggle} tone="overdue" />
              <ReminderGroup title="Today" items={groups.today} onToggle={toggle} tone="today" />
              <ReminderGroup title="Upcoming" items={groups.upcoming} onToggle={toggle} tone="upcoming" />
              <ReminderGroup title="Completed" items={groups.done} onToggle={toggle} tone="done" collapsedByDefault />
            </>
          )}
        </div>

        <div className="panel new-reminder-panel">
          <h3>New reminder</h3>
          <p className="hint">Attach it to a deal to keep everything in one place.</p>
          <form className="new-reminder-form" onSubmit={handleAdd}>
            <div>
              <label className="field-label" htmlFor="reminder-title">
                What needs doing
              </label>
              <input
                id="reminder-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Follow up on proposal"
                required
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="reminder-due">
                Due
              </label>
              <input
                id="reminder-due"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                required
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="reminder-deal">
                Related deal
              </label>
              <select id="reminder-deal" value={dealId} onChange={(e) => setDealId(e.target.value)} style={{ width: "100%" }}>
                <option value="">No deal</option>
                {openDeals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={createReminder.isPending || !title.trim() || !dueAt}>
              <IconPlus width={14} height={14} />
              Add reminder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ReminderGroup({
  title,
  items,
  onToggle,
  tone,
  collapsedByDefault = false,
}: {
  title: string;
  items: { id: number; title: string; due_at: string; done: boolean; deal_title?: string | null }[];
  onToggle: (id: number, done: boolean) => void;
  tone: "overdue" | "today" | "upcoming" | "done";
  collapsedByDefault?: boolean;
}) {
  const [open, setOpen] = useState(!collapsedByDefault);
  if (items.length === 0) return null;

  return (
    <div className="reminder-group">
      <button
        type="button"
        className="reminder-group-title"
        onClick={() => setOpen((o) => !o)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        <IconClock width={13} height={13} />
        {title}
        <span className="count">{items.length}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="reminder-list">
              {items.map((r) => (
                <motion.div
                  layout
                  key={r.id}
                  className={`reminder-row${tone === "overdue" ? " is-overdue" : ""}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                >
                  <button
                    type="button"
                    className={`reminder-check${r.done ? " checked" : ""}`}
                    onClick={() => onToggle(r.id, r.done)}
                    aria-label={r.done ? "Mark as not done" : "Mark as done"}
                  >
                    {r.done && <IconCheck width={12} height={12} color="#1c0f06" />}
                  </button>
                  <div className="reminder-body">
                    <div className={`reminder-title${r.done ? " is-done" : ""}`}>{r.title}</div>
                    {r.deal_title && <div className="reminder-sub">{r.deal_title}</div>}
                  </div>
                  <span className={`reminder-due${tone === "overdue" ? " is-overdue" : tone === "today" ? " is-today" : ""}`}>
                    {formatRelativeDay(r.due_at)}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
