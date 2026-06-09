import "dotenv/config";
import type { Pathway } from "../pathways/types.js";
import { agentEditPathway, type AgentResult } from "./agentEditPathway.js";

// A tiny eval harness: run the agent on golden prompts and score the OUTPUT
// with rule-based graders (the deterministic validator is the main one).
// This is how you test a non-deterministic agent — assert PROPERTIES, not
// exact output.

const START: Pathway = {
  id: "eval",
  name: "Post-Discharge Follow-up",
  department: "Cardiology",
  startStepId: "checkin",
  steps: [
    { id: "checkin", name: "24-hour check-in", action: "send_sms", waitHours: 24, transitions: { patient_replied: "followup", no_response: "escalate" } },
    { id: "escalate", name: "Escalate to navigator", action: "escalate_to_human", transitions: { patient_replied: "followup" } },
    { id: "followup", name: "Day 3 follow-up", action: "send_email", waitHours: 96, transitions: { appointment_booked: "done", no_response: "escalate" } },
    { id: "done", name: "Journey complete", action: "complete", transitions: {} },
  ],
};

type Check = { name: string; fn: (start: Pathway, r: AgentResult) => boolean };

const validates: Check = { name: "validates", fn: (_s, r) => r.validation.ok };
const stepCountUp: Check = { name: "added ≥1 step", fn: (s, r) => r.pathway.steps.length > s.steps.length };
const hasAction = (action: string): Check => ({
  name: `has a ${action} step`,
  fn: (_s, r) => r.pathway.steps.some((st) => st.action === action),
});

const CASES: { name: string; prompt: string; checks: Check[] }[] = [
  {
    name: "add outbound call on no-response",
    prompt: "After the 24-hour check-in, if there is no response, make an outbound phone call before escalating.",
    checks: [validates, stepCountUp, hasAction("schedule_call")],
  },
  {
    name: "add appointment booking",
    prompt: "Before the journey completes, add a step to book a 2-week follow-up appointment.",
    checks: [validates, stepCountUp, hasAction("book_appointment")],
  },
  {
    name: "create a new capability",
    prompt: "If the patient reports a problem, notify a pharmacist (no such block exists — create it).",
    checks: [validates, stepCountUp],
  },
];

async function run() {
  console.log("\n🧪 agent eval\n");
  let fullyPassed = 0;
  let validationPasses = 0;

  for (const c of CASES) {
    const r = await agentEditPathway(c.prompt, START);
    const results = c.checks.map((chk) => ({ name: chk.name, pass: chk.fn(START, r) }));
    const allPass = results.every((x) => x.pass);
    if (allPass) fullyPassed++;
    if (r.validation.ok) validationPasses++;
    console.log(`• ${c.name}`);
    for (const x of results) console.log(`    ${x.pass ? "✓" : "✗"} ${x.name}`);
  }

  console.log(`\nvalidation pass rate: ${validationPasses}/${CASES.length}`);
  console.log(`fully-passing cases:  ${fullyPassed}/${CASES.length}\n`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
