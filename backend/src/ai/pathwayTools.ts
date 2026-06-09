import type { Pathway, ActionType, EventType } from "../pathways/types.js";
import { eventTypes } from "../pathways/capabilities.js";

const VALID_EVENTS = eventTypes.map((e) => e.event) as EventType[];

export type ToolResult = { ok: boolean; message: string; pathway: Pathway };

const ok = (pathway: Pathway, message: string): ToolResult => ({ ok: true, message, pathway });
const err = (pathway: Pathway, message: string): ToolResult => ({ ok: false, message, pathway });

// All tools are pure: take a pathway, return a NEW pathway + a human-readable
// result. The LLM never mutates state directly — it proposes a tool call, we
// run the function, and feed the result back.

export function addStep(
  p: Pathway,
  input: { id: string; name: string; action: string; waitHours?: number },
): ToolResult {
  if (p.steps.some((s) => s.id === input.id)) return err(p, `A step with id "${input.id}" already exists.`);
  const np = structuredClone(p);
  np.steps.push({
    id: input.id,
    name: input.name,
    action: input.action as ActionType,
    waitHours: input.waitHours,
    transitions: {},
  });
  return ok(np, `Added step "${input.id}" (${input.name}, ${input.action}).`);
}

export function connectSteps(
  p: Pathway,
  input: { from: string; event: string; to: string },
): ToolResult {
  if (!p.steps.some((s) => s.id === input.from)) return err(p, `No step "${input.from}".`);
  if (!p.steps.some((s) => s.id === input.to)) return err(p, `No step "${input.to}".`);
  if (!VALID_EVENTS.includes(input.event as EventType))
    return err(p, `Invalid event "${input.event}". Must be one of: ${VALID_EVENTS.join(", ")}.`);
  const np = structuredClone(p);
  np.steps.find((s) => s.id === input.from)!.transitions[input.event as EventType] = input.to;
  return ok(np, `Connected ${input.from} --${input.event}--> ${input.to}.`);
}

export function updateStep(
  p: Pathway,
  input: { id: string; name?: string; action?: string; waitHours?: number },
): ToolResult {
  const step = p.steps.find((s) => s.id === input.id);
  if (!step) return err(p, `No step "${input.id}".`);
  const np = structuredClone(p);
  const target = np.steps.find((s) => s.id === input.id)!;
  if (input.name !== undefined) target.name = input.name;
  if (input.action !== undefined) target.action = input.action as ActionType;
  if (input.waitHours !== undefined) target.waitHours = input.waitHours;
  return ok(np, `Updated step "${input.id}".`);
}

export function deleteStep(p: Pathway, input: { id: string }): ToolResult {
  if (!p.steps.some((s) => s.id === input.id)) return err(p, `No step "${input.id}".`);
  if (p.startStepId === input.id) return err(p, `Cannot delete the start step. Set a new start first.`);
  const np = structuredClone(p);
  np.steps = np.steps.filter((s) => s.id !== input.id);
  // Drop any transitions pointing at the removed step.
  for (const s of np.steps) {
    for (const ev of Object.keys(s.transitions) as EventType[]) {
      if (s.transitions[ev] === input.id) delete s.transitions[ev];
    }
  }
  return ok(np, `Deleted step "${input.id}".`);
}

export function setStart(p: Pathway, input: { id: string }): ToolResult {
  if (!p.steps.some((s) => s.id === input.id)) return err(p, `No step "${input.id}".`);
  const np = structuredClone(p);
  np.startStepId = input.id;
  return ok(np, `Start step is now "${input.id}".`);
}

// Deterministic guardrail: is the whole pathway internally consistent?
export function validatePathway(p: Pathway): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const ids = new Set(p.steps.map((s) => s.id));
  if (p.steps.length === 0) errors.push("Pathway has no steps.");
  if (!ids.has(p.startStepId)) errors.push(`startStepId "${p.startStepId}" is not a defined step.`);
  if (!p.steps.some((s) => s.action === "complete"))
    errors.push("Pathway has no terminal (complete) step.");
  for (const s of p.steps) {
    for (const ev of Object.keys(s.transitions) as EventType[]) {
      const to = s.transitions[ev];
      if (to && !ids.has(to)) errors.push(`Step "${s.id}" transitions to missing step "${to}".`);
    }
  }
  return { ok: errors.length === 0, errors };
}
