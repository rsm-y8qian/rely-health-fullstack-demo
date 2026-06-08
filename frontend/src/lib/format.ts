// Format a wait duration (total minutes) as a compact "1d 2h 30m" string.
export function formatWait(totalMinutes?: number): string | null {
  if (!totalMinutes || totalMinutes <= 0) return null;
  const d = Math.floor(totalMinutes / 1440);
  const h = Math.floor((totalMinutes % 1440) / 60);
  const m = totalMinutes % 60;
  return [d ? `${d}d` : "", h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ");
}

// Split total minutes into days / hours / minutes for the editor inputs.
export function splitWait(totalMinutes?: number): { days: number; hours: number; minutes: number } {
  const t = totalMinutes ?? 0;
  return {
    days: Math.floor(t / 1440),
    hours: Math.floor((t % 1440) / 60),
    minutes: t % 60,
  };
}

export function toMinutes(days: number, hours: number, minutes: number): number {
  return days * 1440 + hours * 60 + minutes;
}

// "just now" / "5 minutes ago" / "3 hours ago" / "2 days ago"
export function formatRelativeTime(iso?: string): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} minute${min > 1 ? "s" : ""} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day > 1 ? "s" : ""} ago`;
}
