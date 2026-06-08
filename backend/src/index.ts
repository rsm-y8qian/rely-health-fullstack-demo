import express from "express";
import cors from "cors";
import "dotenv/config";
import { programs } from "./data/programs.js";
import { z } from "zod";
import { capabilities, eventTypes } from "./pathways/capabilities.js";
import {
  listDepartments,
  listPathways,
  getPathway,
  addPathway,
  createBlankPathway,
  duplicatePathway,
  deletePathway,
  updatePathwayMeta,
} from "./pathways/store.js";
import {
  enroll,
  listEnrollments,
  sendEvent,
  undo,
  seedEnrollments,
} from "./pathways/enrollments.js";
import { generatePathway } from "./ai/generatePathway.js";

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

// Create a fresh blank workflow (the "+" button on the home page).
app.post("/api/pathways/blank", (req, res) => {
  const department = typeof req.body?.department === "string" ? req.body.department : "General";
  res.status(201).json({ pathway: createBlankPathway(department) });
});

// Save a (e.g. AI-generated) workflow so it shows up as a card.
app.post("/api/pathways", (req, res) => {
  const p = req.body?.pathway;
  if (!p || typeof p.name !== "string" || !Array.isArray(p.steps)) {
    return res.status(400).json({ error: "Invalid pathway" });
  }
  res.status(201).json({ pathway: addPathway(p) });
});

// Duplicate a workflow (the copy gets a " (n)" suffix).
app.post("/api/pathways/:id/duplicate", (req, res) => {
  const copy = duplicatePathway(req.params.id);
  if (!copy) return res.status(404).json({ error: "Pathway not found" });
  res.status(201).json({ pathway: copy });
});

// Rename / re-describe a workflow.
const metaSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});
app.patch("/api/pathways/:id", (req, res) => {
  const parsed = metaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const p = updatePathwayMeta(req.params.id, parsed.data);
  if (!p) return res.status(404).json({ error: "Pathway not found" });
  res.json({ pathway: p });
});

// Delete a workflow.
app.delete("/api/pathways/:id", (req, res) => {
  if (!deletePathway(req.params.id)) return res.status(404).json({ error: "Pathway not found" });
  res.status(204).end();
});

// A single pathway by id (what the builder canvas loads).
app.get("/api/pathways/:id", (req, res) => {
  const pathway = getPathway(req.params.id);
  if (!pathway) return res.status(404).json({ error: "Pathway not found" });
  res.json({ pathway });
});

// ---- Enrollments (the engine running on real patients) ----

// Validate request bodies at the system boundary — never trust the client.
const enrollSchema = z.object({
  patientName: z.string().min(1),
  pathwayId: z.string().min(1),
});
const eventSchema = z.object({
  event: z.enum(["timer_elapsed", "patient_replied", "no_response", "appointment_booked"]),
});

app.get("/api/enrollments", (req, res) => {
  const pathwayId = typeof req.query.pathwayId === "string" ? req.query.pathwayId : undefined;
  res.json({ enrollments: listEnrollments(pathwayId) });
});

app.post("/api/enrollments", (req, res) => {
  const parsed = enrollSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid enrollment" });
  const result = enroll(parsed.data.patientName, parsed.data.pathwayId);
  if ("error" in result) return res.status(400).json({ error: result.error });
  res.status(201).json({ enrollment: result });
});

app.post("/api/enrollments/:id/event", (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid event" });
  const result = sendEvent(req.params.id, parsed.data.event);
  if ("error" in result) return res.status(400).json({ error: result.error });
  res.json({ enrollment: result });
});

app.post("/api/enrollments/:id/back", (req, res) => {
  const result = undo(req.params.id);
  if ("error" in result) return res.status(400).json({ error: result.error });
  res.json({ enrollment: result });
});

// ---- AI: generate a pathway from natural language ----
const aiSchema = z.object({
  prompt: z.string().min(1),
  department: z.string().optional(),
});

app.post("/api/ai/generate-pathway", async (req, res) => {
  const parsed = aiSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const result = await generatePathway(parsed.data.prompt, parsed.data.department);
  if ("error" in result) return res.status(422).json({ error: result.error });
  res.json(result);
});

seedEnrollments();

app.listen(PORT, () => {
  console.log(`✅ Rely demo API listening on http://localhost:${PORT}`);
});
