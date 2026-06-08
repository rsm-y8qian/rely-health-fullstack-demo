import type { Program, Pathway, Capability } from "./types";

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

export async function fetchPrograms(): Promise<Program[]> {
  const data = await getJSON<{ programs: Program[] }>("/api/programs");
  return data.programs;
}

export async function fetchDepartments(): Promise<string[]> {
  const data = await getJSON<{ departments: string[] }>("/api/departments");
  return data.departments;
}

export async function fetchPathways(department?: string): Promise<Pathway[]> {
  const q = department ? `?department=${encodeURIComponent(department)}` : "";
  const data = await getJSON<{ pathways: Pathway[] }>(`/api/pathways${q}`);
  return data.pathways;
}

export async function fetchPathway(id: string): Promise<Pathway> {
  const data = await getJSON<{ pathway: Pathway }>(`/api/pathways/${id}`);
  return data.pathway;
}

export async function fetchCapabilities(): Promise<Capability[]> {
  const data = await getJSON<{ capabilities: Capability[] }>("/api/capabilities");
  return data.capabilities;
}
