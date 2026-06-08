// The domain model for clinical pathways.
// A pathway is data, not code — an "engine" (engine.ts) interprets it.

// What happens when a patient ENTERS a step.
export type ActionType =
  | "send_sms"
  | "send_email"
  | "schedule_call"
  | "escalate_to_human"
  | "book_appointment"
  | "complete";

// Things that can happen to a patient and drive a transition.
export type EventType =
  | "timer_elapsed"
  | "patient_replied"
  | "no_response"
  | "appointment_booked";

export interface PathwayStep {
  id: string;
  name: string;
  action: ActionType; // performed when the patient enters this step
  waitHours?: number; // how long to wait before a timer_elapsed event fires
  // event -> id of the next step. A step with no transitions is terminal.
  transitions: Partial<Record<EventType, string>>;
}

export interface Pathway {
  id: string;
  name: string;
  department?: string; // which service line owns this pathway (lightweight tenancy)
  startStepId: string;
  steps: PathwayStep[];
}
