import { Router } from "express";
import { getDb } from "../db/index.js";
import type { ContactRow } from "../types.js";

export const contactsRouter = Router();

contactsRouter.get("/", async (_req, res) => {
  const db = await getDb();
  const result = await db.query<ContactRow>(
    "SELECT * FROM contacts ORDER BY name ASC"
  );
  res.json(result.rows);
});
