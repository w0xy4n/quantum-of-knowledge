import { apiRequest } from "@/lib/api/client";
import type { Assignment, Class } from "@/lib/types";

export function fetchAssignments(): Promise<Assignment[]> {
  return apiRequest<Assignment[]>("/api/assignments");
}

export function fetchClasses(): Promise<Class[]> {
  return apiRequest<Class[]>("/api/classes");
}
