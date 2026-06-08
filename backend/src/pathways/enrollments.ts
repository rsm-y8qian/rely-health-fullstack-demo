import { getPathway } from "./store.js";
import { advance } from "./engine.js";
import type { EventType } from "./types.js";

// A patient enrolled in a pathway, tracking where they currently are.
export interface Enrollment {
  id: string;
  patientName: string;
  pathwayId: string;
  currentStepId: string;
  status: "active" | "completed";
  history: { stepId: string; at: string }[];
}

// In-memory store. (A real app would persist this in a database.)
const enrollments: Enrollment[] = [];
let seq = 1;

export function enroll(patientName: string, pathwayId: string): Enrollment | { error: string } {
  const pathway = getPathway(pathwayId);
  if (!pathway) return { error: "Pathway not found" };
  const e: Enrollment = {
    id: `enr-${seq++}`,
    patientName,
    pathwayId,
    currentStepId: pathway.startStepId,
    status: "active",
    history: [{ stepId: pathway.startStepId, at: new Date().toISOString() }],
  };
  enrollments.push(e);
  return e;
}

export function listEnrollments(pathwayId?: string): Enrollment[] {
  return pathwayId ? enrollments.filter((e) => e.pathwayId === pathwayId) : enrollments;
}

// Drive a patient forward by feeding the engine an event.
export function sendEvent(id: string, event: EventType): Enrollment | { error: string } {
  const e = enrollments.find((x) => x.id === id);
  if (!e) return { error: "Enrollment not found" };
  const pathway = getPathway(e.pathwayId);
  if (!pathway) return { error: "Pathway not found" };

  const result = advance(pathway, e.currentStepId, event);
  if (!result.ok) return { error: result.error ?? "Cannot advance" };

  e.currentStepId = result.nextStepId!;
  e.history.push({ stepId: result.nextStepId!, at: new Date().toISOString() });
  if (result.done) e.status = "completed";
  return e;
}

// Seed a few patients at different stages so the ops view isn't empty.
export function seedEnrollments(): void {
  if (enrollments.length > 0) return;
  enroll("John Carter", "discharge-followup");
  const maria = enroll("Maria Lopez", "discharge-followup") as Enrollment;
  sendEvent(maria.id, "no_response"); // now at "escalate"
  const david = enroll("David Kim", "discharge-followup") as Enrollment;
  sendEvent(david.id, "patient_replied"); // now at "followup"
  enroll("Aisha Khan", "oncology-referral");
}
