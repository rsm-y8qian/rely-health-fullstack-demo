import type { Pathway } from "../types";
import { labelForAction } from "../components/icons";

// A short, human-readable summary of a workflow's flow, e.g.
// "Send SMS → Escalate to Navigator → Book Appointment".
export function summarize(p: Pathway): string {
  const seq: string[] = [];
  for (const step of p.steps) {
    const label = labelForAction(step.action);
    if (seq[seq.length - 1] !== label) seq.push(label);
  }
  const shown = seq.slice(0, 4).join(" → ");
  return seq.length > 4 ? `${shown} → …` : shown;
}
