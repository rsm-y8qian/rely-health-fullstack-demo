import express from "express";
import cors from "cors";
import "dotenv/config";
import { programs } from "./data/programs.js";
import { capabilities, eventTypes } from "./pathways/capabilities.js";
import { listDepartments, listPathways, getPathway } from "./pathways/store.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

// Middleware: allow the frontend (different port) to call us, and parse JSON bodies.
app.use(cors());
app.use(express.json());

// Health check — a tiny endpoint to confirm the server is alive.
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "rely-demo-backend",
    time: new Date().toISOString(),
  });
});

// Return the list of navigation programs the frontend will render.
app.get("/api/programs", (_req, res) => {
  res.json({ programs });
});

// The catalog of building blocks (actions) + the events that drive transitions.
app.get("/api/capabilities", (_req, res) => {
  res.json({ capabilities, eventTypes });
});

// Departments (service lines) — the lightweight tenancy dimension.
app.get("/api/departments", (_req, res) => {
  res.json({ departments: listDepartments() });
});

// Pathways, optionally scoped to a department.
app.get("/api/pathways", (req, res) => {
  const department = typeof req.query.department === "string" ? req.query.department : undefined;
  res.json({ pathways: listPathways(department) });
});

// A single pathway by id (what the builder canvas loads).
app.get("/api/pathways/:id", (req, res) => {
  const pathway = getPathway(req.params.id);
  if (!pathway) return res.status(404).json({ error: "Pathway not found" });
  res.json({ pathway });
});

app.listen(PORT, () => {
  console.log(`✅ Rely demo API listening on http://localhost:${PORT}`);
});
