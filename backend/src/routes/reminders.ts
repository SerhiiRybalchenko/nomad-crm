import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/index.js";
import type { ReminderRow } from "../types.js";

export const remindersRouter = Router();

const REMINDER_SELECT = `
  SELECT r.*, d.title AS deal_title
  FROM reminders r
  LEFT JOIN deals d ON d.id = r.deal_id
`;

remindersRouter.get("/", async (_req, res) => {
  const db = await getDb();
  const result = await db.query<ReminderRow>(
    `${REMINDER_SELECT} ORDER BY r.done ASC, r.due_at ASC`
  );
  res.json(result.rows);
});

const createReminderSchema = z.object({
  dealId: z.number().int().nullable().optional(),
  title: z.string().min(1).max(200),
  dueAt: z.string().min(1),
});

remindersRouter.post("/", async (req, res) => {
  const parsed = createReminderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const r = parsed.data;
  const db = await getDb();

  const inserted = await db.query<{ id: number }>(
    "INSERT INTO reminders (deal_id, title, due_at) VALUES ($1, $2, $3) RETURNING id",
    [r.dealId ?? null, r.title, r.dueAt]
  );
  const result = await db.query<ReminderRow>(`${REMINDER_SELECT} WHERE r.id = $1`, [inserted.rows[0].id]);
  res.status(201).json(result.rows[0]);
});

const updateReminderSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  dueAt: z.string().min(1).optional(),
  done: z.boolean().optional(),
});

remindersRouter.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  const parsed = updateReminderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const r = parsed.data;
  const db = await getDb();

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (r.title !== undefined) { fields.push(`title = $${i++}`); values.push(r.title); }
  if (r.dueAt !== undefined) { fields.push(`due_at = $${i++}`); values.push(r.dueAt); }
  if (r.done !== undefined) { fields.push(`done = $${i++}`); values.push(r.done); }

  if (fields.length > 0) {
    values.push(id);
    await db.query(`UPDATE reminders SET ${fields.join(", ")} WHERE id = $${i}`, values);
  }

  const result = await db.query<ReminderRow>(`${REMINDER_SELECT} WHERE r.id = $1`, [id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(result.rows[0]);
});

remindersRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  const db = await getDb();
  await db.query("DELETE FROM reminders WHERE id = $1", [id]);
  res.status(204).send();
});
