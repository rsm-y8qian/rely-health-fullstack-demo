import {
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  CalendarCheck,
  PhoneCall,
  MapPin,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// Maps the icon name string from the API to a real icon component.
const map: Record<string, LucideIcon> = {
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  CalendarCheck,
  PhoneCall,
  MapPin,
};

export function iconFor(name: string): LucideIcon {
  return map[name] ?? Sparkles;
}
