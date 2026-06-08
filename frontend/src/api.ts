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
