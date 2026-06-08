import { dischargePathway } from "./dischargePathway.js";
import { advance, getStep } from "./engine.js";
import type { EventType } from "./types.js";

// Walk one patient through the pathway by feeding it a sequence of events.
const start = getStep(dischargePathway, dischargePathway.startStepId)!;
console.log(`\n🏥 Pathway: ${dischargePathway.name}`);
console.log(`Enrolled → "${start.name}" → action: ${start.action}\n`);

let current = start.id;
const events: EventType[] = ["no_response", "patient_replied", "appointment_booked"];

for (const event of events) {
  const r = advance(dischargePathway, current, event);
  if (!r.ok) {
    console.log(`  event "${event}" → ✗ ${r.error}`);
    break;
  }
  const flag = r.done ? "  ✅ (journey complete)" : "";
  console.log(`  event "${event}" → "${r.nextStepId}" → action: ${r.action}${flag}`);
  current = r.nextStepId!;
}

// Show that a bad event is rejected (the engine guards itself).
const bad = advance(dischargePathway, "done", "patient_replied");
console.log(`\n  (guard test) event on terminal step → ${bad.ok ? "ok" : "✗ " + bad.error}\n`);
