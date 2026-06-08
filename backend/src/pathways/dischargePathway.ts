import type { Pathway } from "./types.js";

// A post-discharge follow-up journey, expressed entirely as data.
// To change the clinical flow, you edit THIS — the engine never changes.
export const dischargePathway: Pathway = {
  id: "discharge-followup",
  name: "Post-Discharge Follow-up",
  startStepId: "checkin",
  steps: [
    {
      id: "checkin",
      name: "24-hour check-in",
      action: "send_sms", // "How are you feeling today?"
      waitHours: 24,
      transitions: {
        patient_replied: "followup",
        no_response: "escalate",
      },
    },
    {
      id: "escalate",
      name: "Escalate to navigator",
      action: "escalate_to_human", // a human navigator reaches out
      transitions: {
        patient_replied: "followup",
      },
    },
    {
      id: "followup",
      name: "Day 3 follow-up",
      action: "send_email", // "Book your PCP follow-up visit"
      waitHours: 96,
      transitions: {
        appointment_booked: "done",
        no_response: "escalate",
      },
    },
    {
      id: "done",
      name: "Journey complete",
      action: "complete", // terminal — no transitions
      transitions: {},
    },
  ],
};
