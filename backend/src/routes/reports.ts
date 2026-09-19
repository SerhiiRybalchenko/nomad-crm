import { Router } from "express";
import { getDb } from "../db/index.js";
import { DEAL_STAGES } from "../types.js";

export const reportsRouter = Router();

reportsRouter.get("/summary", async (_req, res) => {
  const db = await getDb();

  const byStageResult = await db.query<{ stage: string; count: string; amount: string }>(
    `SELECT stage, count(*)::text AS count, COALESCE(sum(amount),0)::text AS amount
     FROM deals GROUP BY stage`
  );
  const byStageMap = new Map(byStageResult.rows.map((r) => [r.stage, r]));
  const byStage = DEAL_STAGES.map((stage) => ({
    stage,
    count: Number(byStageMap.get(stage)?.count ?? 0),
    amount: Number(byStageMap.get(stage)?.amount ?? 0),
  }));

  // Revenue over the last 6 months (won deals, grouped by close month).
  const revenueResult = await db.query<{ month: string; revenue: string; deals: string }>(
    `SELECT to_char(date_trunc('month', closed_at), 'YYYY-MM') AS month,
            COALESCE(sum(amount),0)::text AS revenue,
            count(*)::text AS deals
     FROM deals
     WHERE stage = 'won' AND closed_at IS NOT NULL
     GROUP BY month
     ORDER BY month`
  );
  const revenueMap = new Map(revenueResult.rows.map((r) => [r.month, r]));
  const revenueOverTime: { month: string; revenue: number; deals: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const row = revenueMap.get(key);
    revenueOverTime.push({
      month: key,
      revenue: Number(row?.revenue ?? 0),
      deals: Number(row?.deals ?? 0),
    });
  }

  const totalsResult = await db.query<{ won: string; lost: string; open: string; pipeline_value: string; won_value: string }>(
    `SELECT
       count(*) FILTER (WHERE stage = 'won')::text AS won,
       count(*) FILTER (WHERE stage = 'lost')::text AS lost,
       count(*) FILTER (WHERE stage NOT IN ('won','lost'))::text AS open,
       COALESCE(sum(amount) FILTER (WHERE stage NOT IN ('won','lost')), 0)::text AS pipeline_value,
       COALESCE(sum(amount) FILTER (WHERE stage = 'won'), 0)::text AS won_value
     FROM deals`
  );
  const t = totalsResult.rows[0];
  const won = Number(t.won);
  const lost = Number(t.lost);
  const conversionRate = won + lost > 0 ? (won / (won + lost)) * 100 : 0;

  res.json({
    byStage,
    revenueOverTime,
    totals: {
      won,
      lost,
      open: Number(t.open),
      pipelineValue: Number(t.pipeline_value),
      wonValue: Number(t.won_value),
      conversionRate,
    },
  });
});
