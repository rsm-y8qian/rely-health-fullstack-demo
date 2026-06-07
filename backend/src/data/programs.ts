// Seed data: Rely Health's navigation programs (from relyhealth.care).
// Synthetic / public marketing content only — no PHI.

export interface Program {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide-react icon name, used by the frontend
}

export const programs: Program[] = [
  {
    id: "discharge",
    title: "Discharge Programs",
    description:
      "Automated post-discharge outreach and follow-up so every patient completes their next best step in care.",
    icon: "HeartPulse",
  },
  {
    id: "quality-gaps",
    title: "Quality Gap Programs",
    description:
      "Proactively identify and close care gaps across patient populations before they become costly.",
    icon: "ShieldCheck",
  },
  {
    id: "specialty",
    title: "Specialty Service Lines",
    description:
      "Coordinate complex referrals and pre-procedure prep across cardiology, oncology, and orthopedics.",
    icon: "Stethoscope",
  },
  {
    id: "front-desk",
    title: "Front Desk Programs",
    description:
      "AI handles scheduling, intake, and appointment confirmation so staff focus on patients in the room.",
    icon: "CalendarCheck",
  },
  {
    id: "call-center",
    title: "Call Center Operations",
    description:
      "Hybrid AI-human call management: AI handles first-line interactions, navigators resolve escalations.",
    icon: "PhoneCall",
  },
  {
    id: "on-site",
    title: "On-Site Coverage",
    description:
      "Embed human navigators backed by real-time AI directly at EDs, clinics, and bedside.",
    icon: "MapPin",
  },
];
