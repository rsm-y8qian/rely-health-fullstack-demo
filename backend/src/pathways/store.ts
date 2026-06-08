import type { Pathway } from "./types.js";
import { dischargePathway } from "./dischargePathway.js";
import { oncologyPathway } from "./oncologyPathway.js";

// Extra seed workflows so each department has a few cards to show.
const heartFailurePathway: Pathway = {
  id: "hf-monitoring",
  name: "Heart Failure Weight Monitoring",
  department: "Cardiology",
  startStepId: "weigh",
  steps: [
    {
      id: "weigh",
      name: "Daily weight check-in",
      action: "send_sms",
      waitHours: 24,
      transitions: { patient_replied: "review", no_response: "remind" },
    },
    {
      id: "remind",
      name: "Reminder text",
      action: "send_sms",
      waitHours: 12,
      transitions: { patient_replied: "review", no_response: "escalate" },
    },
    {
      id: "review",
      name: "Nurse reviews weight trend",
      action: "escalate_to_human",
      transitions: { timer_elapsed: "done", patient_replied: "done" },
    },
    {
      id: "escalate",
      name: "Escalate to navigator",
      action: "escalate_to_human",
      transitions: { patient_replied: "review" },
    },
    { id: "done", name: "Monitoring cycle complete", action: "complete", transitions: {} },
  ],
};

const chemoSymptomPathway: Pathway = {
  id: "chemo-symptoms",
  name: "Chemo Symptom Check-In",
  department: "Oncology",
  startStepId: "checkin",
  steps: [
    {
      id: "checkin",
      name: "Symptom check-in text",
      action: "send_sms",
      waitHours: 24,
      transitions: { patient_replied: "triage", no_response: "call" },
    },
    {
      id: "call",
      name: "Outreach call",
      action: "schedule_call",
      transitions: { patient_replied: "triage", no_response: "escalate" },
    },
    {
      id: "triage",
      name: "Nurse triages symptoms",
      action: "escalate_to_human",
      transitions: { timer_elapsed: "done" },
    },
    {
      id: "escalate",
      name: "Escalate to navigator",
      action: "escalate_to_human",
      transitions: { patient_replied: "triage" },
    },
    { id: "done", name: "Check-in complete", action: "complete", transitions: {} },
  ],
};

// In-memory registry (mutable for the demo; a real app would use a database).
const pathways: Pathway[] = [
  dischargePathway,
  heartFailurePathway,
  oncologyPathway,
  chemoSymptomPathway,
];

export function listDepartments(): string[] {
  return [...new Set(pathways.map((p) => p.department).filter((d): d is string => !!d))];
}

export function listPathways(department?: string): Pathway[] {
  return department ? pathways.filter((p) => p.department === department) : pathways;
}

export function getPathway(id: string): Pathway | undefined {
  return pathways.find((p) => p.id === id);
}

export function addPathway(p: Pathway): Pathway {
  pathways.push(p);
  return p;
}

export function deletePathway(id: string): boolean {
  const i = pathways.findIndex((p) => p.id === id);
  if (i === -1) return false;
  pathways.splice(i, 1);
  return true;
}

// A fresh blank workflow with a single starter step.
export function createBlankPathway(department: string): Pathway {
  const p: Pathway = {
    id: `wf-${Date.now()}`,
    name: "Untitled workflow",
    department,
    startStepId: "start",
    steps: [{ id: "start", name: "New step", action: "send_sms", transitions: {} }],
  };
  pathways.push(p);
  return p;
}

// Duplicate a workflow; the copy's name gets a " (n)" suffix to distinguish it.
export function duplicatePathway(id: string): Pathway | undefined {
  const orig = getPathway(id);
  if (!orig) return undefined;
  const base = orig.name.replace(/ \(\d+\)$/, "");
  const copies = pathways.filter(
    (p) => p.department === orig.department && (p.name === base || p.name.startsWith(`${base} (`)),
  ).length;
  const copy: Pathway = {
    ...structuredClone(orig),
    id: `${orig.id}-copy-${Date.now()}`,
    name: `${base} (${copies})`,
  };
  pathways.push(copy);
  return copy;
}
