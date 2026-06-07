import express from "express";
import cors from "cors";
import "dotenv/config";
import { programs } from "./data/programs.js";

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

app.listen(PORT, () => {
  console.log(`✅ Rely demo API listening on http://localhost:${PORT}`);
});
