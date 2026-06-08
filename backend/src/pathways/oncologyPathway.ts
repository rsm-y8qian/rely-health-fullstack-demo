import type { Pathway } from "./types.js";

// A second pathway under a different department, to show department scoping.
export const oncologyPathway: Pathway = {
  id: "oncology-referral",
  name: "Oncology Referral Coordination",
  department: "Oncology",
  startStepId: "intake",
  steps: [
    {
      id: "intake",
      name: "Referral received",
      action: "send_sms",
      waitHours: 2,
      transitions: { patient_replied: "schedule", no_response: "call" },
    },
    {
      id: "call",
      name: "Outreach call",
      action: "schedule_call",
      transitions: { patient_replied: "schedule", no_response: "escalate" },
    },
    {
      id: "schedule",
      name: "Book consult",
      action: "book_appointment",
      transitions: { appointment_booked: "done" },
    },
    {
      id: "escalate",
      name: "Escalate to navigator",
      action: "escalate_to_human",
      transitions: { patient_replied: "schedule" },
    },
    { id: "done", name: "Coordinated", action: "complete", transitions: {} },
  ],
};
