import { apiRequest } from "@/lib/api/client";
import type { Assignment, Priority, Status } from "@/lib/types";

export class AssignmentWriteError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "AssignmentWriteError";
    this.cause = cause;
  }
}

export interface AssignmentDraft {
  title: string;
  subject: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  class_id?: string | null;
  group_id?: string | null;
  image_url?: string | null;
  attachment_urls?: string[];
}

async function write<T>(path: string, action: string, init: RequestInit): Promise<T> {
  try {
    return await apiRequest<T>(path, init);
  } catch (error) {
    console.error(`Could not ${action}:`, error);
    const message = error instanceof Error ? error.message : `Не удалось ${action}. Изменение не сохранено.`;
    throw new AssignmentWriteError(message, error);
  }
}

export async function createAssignment(draft: AssignmentDraft): Promise<void> {
  await write<Assignment>("/api/assignments", "добавить задание", { method: "POST", body: JSON.stringify(draft) });
}

export async function createAssignments(drafts: AssignmentDraft[]): Promise<void> {
  if (!drafts.length) return;
  await write<Assignment[]>("/api/assignments", "импортировать задания", { method: "POST", body: JSON.stringify(drafts) });
}

export async function updateAssignment(id: string, patch: Partial<AssignmentDraft>): Promise<void> {
  await write<Assignment>(`/api/assignments/${id}`, "сохранить изменения", { method: "PATCH", body: JSON.stringify(patch) });
}

export async function setAssignmentStatus(id: string, status: Status): Promise<void> {
  await write<Assignment>(
    `/api/assignments/${id}`,
    status === "completed" ? "отметить задание выполненным" : "вернуть задание в работу",
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}

export async function deleteAssignment(id: string): Promise<void> {
  await write<{ ok: true }>(`/api/assignments/${id}`, "удалить задание", { method: "DELETE" });
}
