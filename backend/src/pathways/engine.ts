import type { Pathway, PathwayStep, EventType, ActionType } from "./types.js";

export interface AdvanceResult {
  ok: boolean;
  error?: string;
  nextStepId?: string;
  action?: ActionType;
  done?: boolean;
}

export function getStep(pathway: Pathway, stepId: string): PathwayStep | undefined {
  return pathway.steps.find((s) => s.id === stepId);
}

export function isTerminal(step: PathwayStep): boolean {
  return step.action === "complete" || Object.keys(step.transitions).length === 0;
}

// Given where a patient is and what just happened, compute the next step.
// Pure function: no I/O, no side effects — same inputs always give same output.
export function advance(
  pathway: Pathway,
  currentStepId: string,
  event: EventType,
): AdvanceResult {
  const step = getStep(pathway, currentStepId);
  if (!step) return { ok: false, error: `Unknown step "${currentStepId}"` };

  const nextId = step.transitions[event];
  if (!nextId) {
    return { ok: false, error: `Step "${step.name}" has no transition for event "${event}"` };
  }

  const nextStep = getStep(pathway, nextId);
  if (!nextStep) {
    return { ok: false, error: `Transition points to missing step "${nextId}"` };
  }

  return {
    ok: true,
    nextStepId: nextStep.id,
    action: nextStep.action,
    done: isTerminal(nextStep),
  };
}
