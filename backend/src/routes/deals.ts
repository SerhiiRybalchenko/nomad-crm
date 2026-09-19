import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/index.js";
import { DEAL_STAGES, type DealRow } from "../types.js";

export const dealsRouter = Router();

const DEAL_SELECT = `
  SELECT
    d.*,
    c.name AS company_name,
    p.name AS contact_name
  FROM deals d
  LEFT JOIN companies c ON c.id = d.company_id
  LEFT JOIN contacts p ON p.id = d.contact_id
`;

dealsRouter.get("/", async (_req, res) => {
  const db = await getDb();
  const result = await db.query<DealRow>(
    `${DEAL_SELECT} ORDER BY d.stage, d.position ASC, d.created_at DESC`
  );
  res.json(result.rows);
});

const createDealSchema = z.object({
  title: z.string().min(1).max(200),
  companyId: z.number().int().nullable().optional(),
  contactId: z.number().int().nullable().optional(),
  stage: z.enum(["lead", "contacted", "proposal", "won", "lost"]).default("lead"),
  amount: z.number().min(0).default(0),
  probability: z.number().int().min(0).max(100).default(20),
  expectedCloseDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

dealsRouter.post("/", async (req, res) => {
  const parsed = createDealSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const d = parsed.data;
  const db = await getDb();

  const posResult = await db.query<{ next: number }>(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next FROM deals WHERE stage = $1",
    [d.stage]
  );
  const nextPosition = posResult.rows[0]?.next ?? 0;

  const inserted = await db.query<{ id: number }>(
    `INSERT INTO deals
      (title, company_id, contact_id, stage, amount, probability, expected_close_date, notes, position)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
    [
      d.title,
      d.companyId ?? null,
      d.contactId ?? null,
      d.stage,
      d.amount,
      d.probability,
      d.expectedCloseDate ?? null,
      d.notes ?? null,
      nextPosition,
    ]
  );

  const result = await db.query<DealRow>(`${DEAL_SELECT} WHERE d.id = $1`, [inserted.rows[0].id]);
  res.status(201).json(result.rows[0]);
});

const updateDealSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  companyId: z.number().int().nullable().optional(),
  contactId: z.number().int().nullable().optional(),
  stage: z.enum(["lead", "contacted", "proposal", "won", "lost"]).optional(),
  amount: z.number().min(0).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  position: z.number().int().min(0).optional(),
});

dealsRouter.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateDealSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const d = parsed.data;
  const db = await getDb();

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  const columnMap: Record<string, unknown> = {
    title: d.title,
    company_id: d.companyId,
    contact_id: d.contactId,
    stage: d.stage,
    amount: d.amount,
    probability: d.probability,
    expected_close_date: d.expectedCloseDate,
    notes: d.notes,
    position: d.position,
  };

  for (const [col, val] of Object.entries(columnMap)) {
    if (val !== undefined) {
      fields.push(`${col} = $${i++}`);
      values.push(val);
    }
  }

  // Moving into won/lost stamps closed_at; moving back out clears it.
  if (d.stage === "won" || d.stage === "lost") {
    fields.push(`closed_at = now()`);
  } else if (d.stage) {
    fields.push(`closed_at = NULL`);
  }

  if (fields.length === 0) {
    const existing = await db.query<DealRow>(`${DEAL_SELECT} WHERE d.id = $1`, [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "Not found" });
    return res.json(existing.rows[0]);
  }

  fields.push(`updated_at = now()`);
  values.push(id);

  await db.query(`UPDATE deals SET ${fields.join(", ")} WHERE id = $${i}`, values);

  const result = await db.query<DealRow>(`${DEAL_SELECT} WHERE d.id = $1`, [id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(result.rows[0]);
});

const reorderSchema = z.object({
  columns: z.array(
    z.object({
      stage: z.enum(["lead", "contacted", "proposal", "won", "lost"]),
      dealIds: z.array(z.number().int()),
    })
  ),
});

// Batch-updates stage + position for one or more kanban columns in a single call,
// used after a drag-and-drop reorder or cross-column move on the board.
dealsRouter.patch("/reorder/batch", async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const db = await getDb();

  for (const col of parsed.data.columns) {
    if (!DEAL_STAGES.includes(col.stage)) continue;
    for (let idx = 0; idx < col.dealIds.length; idx++) {
      const dealId = col.dealIds[idx];
      const stampClosed = col.stage === "won" || col.stage === "lost";
      await db.query(
        `UPDATE deals SET stage = $1, position = $2, updated_at = now(),
           closed_at = CASE WHEN $3 THEN COALESCE(closed_at, now()) ELSE NULL END
         WHERE id = $4`,
        [col.stage, idx, stampClosed, dealId]
      );
    }
  }

  const result = await db.query<DealRow>(`${DEAL_SELECT} ORDER BY d.stage, d.position ASC`);
  res.json(result.rows);
});

dealsRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
  const db = await getDb();
  await db.query("DELETE FROM deals WHERE id = $1", [id]);
  res.status(204).send();
});
