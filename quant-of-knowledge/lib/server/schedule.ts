import "server-only";
import { and, asc, eq } from "drizzle-orm";
import type { z } from "zod";
import { ApiError } from "@/lib/api/http";
import { db, ensureDatabase } from "@/lib/db";
import { scheduleToJson } from "@/lib/db/serialize";
import { scheduleEntries } from "@/lib/db/schema";
import { isGroupMember, isGroupStarosta } from "./access";
import type { scheduleDraftSchema } from "./validation";

type Draft = z.infer<typeof scheduleDraftSchema>;
export type ScheduleScope = { userId?: string; groupId?: string };

function values(draft: Draft) {
  return {
    title: draft.title,
    dayOfWeek: draft.day_of_week,
    startTime: draft.start_time,
    endTime: draft.end_time || null,
    location: draft.location?.trim() || null,
    note: draft.note?.trim() || null,
    color: draft.color && draft.color !== "default" ? draft.color : null,
  };
}

function owner(scope: ScheduleScope, userId: string) {
  if (scope.groupId) return { groupId: scope.groupId, userId: null };
  if (scope.userId && scope.userId !== userId) throw new ApiError(403, "Нельзя изменить чужое расписание.");
  return { userId, groupId: null };
}

export async function listSchedule(userId: string, scope: ScheduleScope) {
  await ensureDatabase();
  if (scope.groupId) {
    if (!(await isGroupMember(scope.groupId, userId))) throw new ApiError(403, "Вы не участник этой группы.");
    const rows = await db.select().from(scheduleEntries).where(eq(scheduleEntries.groupId, scope.groupId)).orderBy(asc(scheduleEntries.dayOfWeek), asc(scheduleEntries.startTime));
    return rows.map(scheduleToJson);
  }
  if (scope.userId && scope.userId !== userId) throw new ApiError(403, "Это расписание вам недоступно.");
  const rows = await db.select().from(scheduleEntries).where(eq(scheduleEntries.userId, userId)).orderBy(asc(scheduleEntries.dayOfWeek), asc(scheduleEntries.startTime));
  return rows.map(scheduleToJson);
}

export async function createScheduleEntry(userId: string, scope: ScheduleScope, draft: Draft) {
  await ensureDatabase();
  if (scope.groupId && !(await isGroupStarosta(scope.groupId, userId))) throw new ApiError(403, "Только староста может менять расписание группы.");
  const rows = await db.insert(scheduleEntries).values({ ...owner(scope, userId), ...values(draft) }).returning();
  return scheduleToJson(rows[0]);
}

async function writable(id: string, userId: string) {
  const rows = await db.select().from(scheduleEntries).where(eq(scheduleEntries.id, id)).limit(1);
  const row = rows[0];
  if (!row) throw new ApiError(404, "Запись расписания не найдена.");
  if (row.userId === userId) return row;
  if (row.groupId && (await isGroupStarosta(row.groupId, userId))) return row;
  throw new ApiError(403, "У вас нет прав на изменение этой записи.");
}

export async function updateScheduleEntry(userId: string, id: string, draft: Draft) {
  await ensureDatabase();
  await writable(id, userId);
  const rows = await db.update(scheduleEntries).set(values(draft)).where(eq(scheduleEntries.id, id)).returning();
  return scheduleToJson(rows[0]);
}

export async function deleteScheduleEntry(userId: string, id: string) {
  await ensureDatabase();
  await writable(id, userId);
  await db.delete(scheduleEntries).where(and(eq(scheduleEntries.id, id)));
}
