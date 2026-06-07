# Rely Health — Full Stack Demo

A vertical-slice demo of a hybrid Human-AI patient orchestration platform, built to mirror Rely Health's product suite:

- **Pathway builder** — a no-code rules/workflow engine for clinical journeys
- **Communication CRM** — AI-drafted, human-reviewed patient messaging (Anthropic API + safety guardrails)
- **Interoperability layer** — ingests and normalizes real-time FHIR-style data feeds

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + TypeScript + Tailwind + Framer Motion |
| Backend | Node.js |
| Ingestion | Python |
| AI | Anthropic API (Claude) with guardrails |

## Structure

```
frontend/    React app
backend/     Node.js API
ingestion/   Python FHIR ingestion service
docs/        Job description, design reference, architecture notes
```

> Demo uses synthetic data only — no real PHI.
