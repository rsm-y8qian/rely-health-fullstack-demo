import {
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  CalendarCheck,
  PhoneCall,
  MapPin,
  MessageSquare,
  Mail,
  UserPlus,
  CheckCircle2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// Maps an icon name string (from the API) to a real icon component.
const map: Record<string, LucideIcon> = {
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  CalendarCheck,
  PhoneCall,
  MapPin,
  MessageSquare,
  Mail,
  UserPlus,
  CheckCircle2,
};

export function iconFor(name: string): LucideIcon {
  return map[name] ?? Sparkles;
}

// Maps a pathway action type to its icon.
const actionIcons: Record<string, string> = {
  send_sms: "MessageSquare",
  send_email: "Mail",
  schedule_call: "PhoneCall",
  escalate_to_human: "UserPlus",
  book_appointment: "CalendarCheck",
  complete: "CheckCircle2",
};

export function iconForAction(action: string): LucideIcon {
  return iconFor(actionIcons[action] ?? "Sparkles");
}

// Human-readable label for an action type (no raw snake_case in the UI).
const actionLabels: Record<string, string> = {
  send_sms: "Send SMS",
  send_email: "Send Email",
  schedule_call: "Schedule Call",
  escalate_to_human: "Escalate to Navigator",
  book_appointment: "Book Appointment",
  complete: "Complete",
};

export function labelForAction(action: string): string {
  return actionLabels[action] ?? action;
}
