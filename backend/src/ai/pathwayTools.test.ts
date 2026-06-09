import type { Pathway } from "../pathways/types.js";
import {
  addStep,
  connectSteps,
  updateStep,
  deleteStep,
  setStart,
  validatePathway,
} from "./pathwayTools.js";

// Tiny test harness (no framework needed for a demo).
let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}`);
  }
}

const base = (): Pathway => ({
  id: "t",
  name: "Test",
  startStepId: "a",
  steps: [
    { id: "a", name: "Check-in", action: "send_sms", waitHours: 24, transitions: {} },
    { id: "done", name: "Done", action: "complete", transitions: {} },
  ],
});

console.log("\n🧪 pathwayTools unit tests\n");

// addStep
let r = addStep(base(), { id: "b", name: "Escalate", action: "escalate_to_human" });
check("addStep adds a new step", r.ok && r.pathway.steps.length === 3);
check("addStep rejects duplicate id", !addStep(base(), { id: "a", name: "X", action: "send_sms" }).ok);
check("addStep is pure (original unchanged)", base().steps.length === 2);

// connectSteps
r = connectSteps(base(), { from: "a", event: "patient_replied", to: "done" });
check("connectSteps adds a valid transition", r.ok && r.pathway.steps[0].transitions.patient_replied === "done");
check("connectSteps rejects an invalid event", !connectSteps(base(), { from: "a", event: "banana", to: "done" }).ok);
check("connectSteps rejects a missing target", !connectSteps(base(), { from: "a", event: "no_response", to: "ghost" }).ok);

// updateStep
r = updateStep(base(), { id: "a", name: "Renamed", waitHours: 12 });
check("updateStep changes fields", r.ok && r.pathway.steps[0].name === "Renamed" && r.pathway.steps[0].waitHours === 12);
check("updateStep rejects unknown step", !updateStep(base(), { id: "ghost", name: "X" }).ok);

// deleteStep (+ dangling transition cleanup)
const withEdge = connectSteps(base(), { from: "a", event: "patient_replied", to: "done" }).pathway;
r = deleteStep(withEdge, { id: "done" });
check("deleteStep removes the step", r.ok && !r.pathway.steps.some((s) => s.id === "done"));
check("deleteStep cleans dangling transitions", r.ok && r.pathway.steps[0].transitions.patient_replied === undefined);
check("deleteStep refuses to delete the start step", !deleteStep(base(), { id: "a" }).ok);

// setStart
check("setStart updates the start", setStart(base(), { id: "done" }).pathway.startStepId === "done");
check("setStart rejects unknown step", !setStart(base(), { id: "ghost" }).ok);

// validatePathway
check("validatePathway passes a sound pathway", validatePathway(base()).ok);
check(
  "validatePathway flags a missing terminal",
  !validatePathway({ ...base(), steps: [{ id: "a", name: "x", action: "send_sms", transitions: {} }], startStepId: "a" }).ok,
);
check(
  "validatePathway flags a bad transition target",
  !validatePathway({
    ...base(),
    steps: [
      { id: "a", name: "x", action: "send_sms", transitions: { patient_replied: "ghost" } },
      { id: "done", name: "d", action: "complete", transitions: {} },
    ],
  }).ok,
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
