import type { Program, Pathway, Capability, Enrollment, EventType } from "./types";

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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

export async function savePathway(pathway: Pathway): Promise<Pathway> {
  const data = await postJSON<{ pathway: Pathway }>("/api/pathways", { pathway });
  return data.pathway;
}

export async function createBlankPathway(department: string): Promise<Pathway> {
  const data = await postJSON<{ pathway: Pathway }>("/api/pathways/blank", { department });
  return data.pathway;
}

export async function duplicatePathway(id: string): Promise<Pathway> {
  const data = await postJSON<{ pathway: Pathway }>(`/api/pathways/${id}/duplicate`, {});
  return data.pathway;
}

export async function deletePathway(id: string): Promise<void> {
  const res = await fetch(`/api/pathways/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Request failed (${res.status})`);
}

export async function updatePathwayMeta(
  id: string,
  meta: { name?: string; description?: string },
): Promise<Pathway> {
  const res = await fetch(`/api/pathways/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meta),
  });
  const data = (await res.json()) as { pathway?: Pathway; error?: string };
  if (!res.ok || !data.pathway) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data.pathway;
}

export async function fetchEnrollments(pathwayId: string): Promise<Enrollment[]> {
  const data = await getJSON<{ enrollments: Enrollment[] }>(
    `/api/enrollments?pathwayId=${encodeURIComponent(pathwayId)}`,
  );
  return data.enrollments;
}

export async function enrollPatient(patientName: string, pathwayId: string): Promise<Enrollment> {
  const data = await postJSON<{ enrollment: Enrollment }>("/api/enrollments", {
    patientName,
    pathwayId,
  });
  return data.enrollment;
}

export async function sendPatientEvent(id: string, event: EventType): Promise<Enrollment> {
  const data = await postJSON<{ enrollment: Enrollment }>(`/api/enrollments/${id}/event`, { event });
  return data.enrollment;
}

export async function undoPatient(id: string): Promise<Enrollment> {
  const data = await postJSON<{ enrollment: Enrollment }>(`/api/enrollments/${id}/back`, {});
  return data.enrollment;
}

// Ask the AI to generate a pathway from natural language. Surfaces the server's
// guardrail error message when generation is rejected.
export async function generatePathwayAI(prompt: string, department?: string): Promise<Pathway> {
  const res = await fetch("/api/ai/generate-pathway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, department }),
  });
  const data = (await res.json()) as { pathway?: Pathway; error?: string };
  if (!res.ok || !data.pathway) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data.pathway;
}
