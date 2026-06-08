import type { Pathway } from "./types.js";
import { dischargePathway } from "./dischargePathway.js";
import { oncologyPathway } from "./oncologyPathway.js";

// In-memory pathway registry. (A real app would use a database.)
const pathways: Pathway[] = [dischargePathway, oncologyPathway];

export function listDepartments(): string[] {
  return [...new Set(pathways.map((p) => p.department).filter((d): d is string => !!d))];
}

export function listPathways(department?: string): Pathway[] {
  return department ? pathways.filter((p) => p.department === department) : pathways;
}

export function getPathway(id: string): Pathway | undefined {
  return pathways.find((p) => p.id === id);
}
