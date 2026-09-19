import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { getDb } from "./db/index.js";
import { companiesRouter } from "./routes/companies.js";
import { contactsRouter } from "./routes/contacts.js";
import { dealsRouter } from "./routes/deals.js";
import { remindersRouter } from "./routes/reminders.js";
import { reportsRouter } from "./routes/reports.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// backend/dist/index.js -> ../../frontend/dist, so one deployed service can
// serve the built SPA alongside the API without a separate static host.
const FRONTEND_DIST = path.resolve(__dirname, "..", "..", "frontend", "dist");

const PORT = Number(process.env.PORT ?? 4000);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", engine: "pglite (embedded Postgres/WASM)" });
});

app.use("/api/companies", companiesRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/reports", reportsRouter);

app.use(express.static(FRONTEND_DIST));
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"));
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function main() {
  await getDb();
  app.listen(PORT, () => {
    console.log(`[nomad-crm-api] listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
