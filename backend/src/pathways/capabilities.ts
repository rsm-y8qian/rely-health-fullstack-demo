import type { ActionType, EventType } from "./types.js";

// The catalog of building blocks the no-code builder (and the AI) can compose.
export interface Capability {
  action: ActionType;
  label: string;
  description: string;
  icon: string; // lucide-react icon name for the frontend
}

export const capabilities: Capability[] = [
  { action: "send_sms", label: "Send SMS", description: "Text the patient", icon: "MessageSquare" },
  { action: "send_email", label: "Send Email", description: "Email the patient", icon: "Mail" },
  { action: "schedule_call", label: "Schedule Call", description: "Queue an outbound call", icon: "PhoneCall" },
  { action: "escalate_to_human", label: "Escalate to Navigator", description: "Hand off to a human care navigator", icon: "UserPlus" },
  { action: "book_appointment", label: "Book Appointment", description: "Book or confirm a visit", icon: "CalendarCheck" },
  { action: "complete", label: "Complete", description: "End the journey", icon: "CheckCircle2" },
];

export const eventTypes: { event: EventType; label: string }[] = [
  { event: "patient_replied", label: "Patient replied" },
  { event: "no_response", label: "No response" },
  { event: "timer_elapsed", label: "Timer elapsed" },
  { event: "appointment_booked", label: "Appointment booked" },
];
