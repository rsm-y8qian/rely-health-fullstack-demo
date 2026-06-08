// Shared types. Mirrors the shapes the backend returns.
export interface Program {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export type ActionType =
  | "send_sms"
  | "send_email"
  | "schedule_call"
  | "escalate_to_human"
  | "book_appointment"
  | "complete";

export type EventType =
  | "timer_elapsed"
  | "patient_replied"
  | "no_response"
  | "appointment_booked";

// The fixed set of events the engine understands (used by editable edges).
export const EVENT_OPTIONS: EventType[] = [
  "patient_replied",
  "no_response",
  "timer_elapsed",
  "appointment_booked",
];

export interface PathwayStep {
  id: string;
  name: string;
  action: ActionType;
  waitHours?: number;
  transitions: Partial<Record<EventType, string>>;
}

export interface Pathway {
  id: string;
  name: string;
  department?: string;
  description?: string;
  updatedAt?: string;
  startStepId: string;
  steps: PathwayStep[];
}

export interface Capability {
  action: ActionType;
  label: string;
  description: string;
  icon: string;
}

export interface Enrollment {
  id: string;
  patientName: string;
  pathwayId: string;
  currentStepId: string;
  status: "active" | "completed";
  history: { stepId: string; at: string }[];
}
