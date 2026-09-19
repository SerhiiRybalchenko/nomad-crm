import { Router } from "express";
import { getDb } from "../db/index.js";
import type { CompanyRow } from "../types.js";

export const companiesRouter = Router();

companiesRouter.get("/", async (_req, res) => {
  const db = await getDb();
  const result = await db.query<CompanyRow>(
    "SELECT * FROM companies ORDER BY name ASC"
  );
  res.json(result.rows);
});
