import { apiRequest } from "@/lib/api/client";

export interface ScheduleEntry {
  id: string;
  user_id: string | null;
  group_id: string | null;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string | null;
  location: string | null;
  note: string | null;
  color: string | null;
  created_at: string;
}
export interface ScheduleEntryDraft {
  title: string;
  day_of_week: number;
  start_time: string;
  end_time?: string | null;
  location?: string | null;
  note?: string | null;
  color?: string | null;
}
export const SCHEDULE_COLORS = [
  { value: "default", label: "Обычный", swatch: "bg-muted-foreground/40" },
  { value: "blue", label: "Синий", swatch: "bg-blue-500" },
  { value: "emerald", label: "Зелёный", swatch: "bg-emerald-500" },
  { value: "amber", label: "Жёлтый", swatch: "bg-amber-500" },
  { value: "rose", label: "Розовый", swatch: "bg-rose-500" },
  { value: "violet", label: "Фиолетовый", swatch: "bg-violet-500" },
] as const;
export type ScheduleColor = (typeof SCHEDULE_COLORS)[number]["value"];
export function scheduleColorSwatch(color: string | null): string | null {
  if (!color || color === "default") return null;
  return SCHEDULE_COLORS.find((c) => c.value === color)?.swatch ?? null;
}
export type ScheduleScope = { userId: string } | { groupId: string };
function query(scope: ScheduleScope): string {
  return "userId" in scope ? `userId=${encodeURIComponent(scope.userId)}` : `groupId=${encodeURIComponent(scope.groupId)}`;
}
export function fetchScheduleEntries(scope: ScheduleScope): Promise<ScheduleEntry[]> {
  return apiRequest<ScheduleEntry[]>(`/api/schedule?${query(scope)}`);
}
export async function addScheduleEntry(scope: ScheduleScope, draft: ScheduleEntryDraft): Promise<void> {
  await apiRequest("/api/schedule", { method: "POST", body: JSON.stringify({ scope, entry: draft }) });
}
export async function updateScheduleEntry(id: string, draft: ScheduleEntryDraft): Promise<void> {
  await apiRequest(`/api/schedule/${id}`, { method: "PATCH", body: JSON.stringify(draft) });
}
function toMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
export function findScheduleConflict(entries: ScheduleEntry[], dayOfWeek: number, startTime: string, endTime: string | null, excludeId?: string): ScheduleEntry | null {
  const start = toMinutes(startTime);
  const end = endTime ? toMinutes(endTime) : start;
  for (const other of entries) {
    if (other.day_of_week !== dayOfWeek || other.id === excludeId) continue;
    const otherStart = toMinutes(other.start_time);
    const otherEnd = other.end_time ? toMinutes(other.end_time) : otherStart;
    if (start === otherStart) return other;
    if (start < otherEnd && otherStart < end) return other;
  }
  return null;
}
export async function deleteScheduleEntry(id: string): Promise<void> {
  await apiRequest(`/api/schedule/${id}`, { method: "DELETE" });
}
