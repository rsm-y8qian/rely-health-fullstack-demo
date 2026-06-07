import type { Program } from "./types";

// Calls our own /api/programs (Vite proxies it to the backend on :4000).
export async function fetchPrograms(): Promise<Program[]> {
  const res = await fetch("/api/programs");
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = (await res.json()) as { programs: Program[] };
  return data.programs;
}
