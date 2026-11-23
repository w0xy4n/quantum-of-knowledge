import "server-only";
import { and, asc, eq, inArray, or } from "drizzle-orm";
import type { z } from "zod";
import { ApiError } from "@/lib/api/http";
import { db, ensureDatabase } from "@/lib/db";
import { assignmentToJson } from "@/lib/db/serialize";
import { assignments, classes } from "@/lib/db/schema";
import { isGroupStarosta, membershipsFor } from "./access";
import type { assignmentDraftSchema, assignmentPatchSchema } from "./validation";

type Draft = z.infer<typeof assignmentDraftSchema>;
type Patch = z.infer<typeof assignmentPatchSchema>;

function databaseValues(draft: Partial<Draft>) {
  return {
    ...(draft.title !== undefined ? { title: draft.title } : {}),
    ...(draft.subject !== undefined ? { subject: draft.subject } : {}),
    ...(draft.description !== undefined ? { description: draft.description } : {}),
    ...(draft.due_date !== undefined ? { dueDate: draft.due_date } : {}),
    ...(draft.priority !== undefined ? { priority: draft.priority } : {}),
    ...(draft.class_id !== undefined ? { classId: draft.class_id } : {}),
    ...(draft.group_id !== undefined ? { groupId: draft.group_id } : {}),
    ...(draft.image_url !== undefined ? { imageUrl: draft.image_url } : {}),
    ...(draft.attachment_urls !== undefined ? { attachmentUrls: draft.attachment_urls } : {}),
  };
}

async function validateClass(classId: string | null | undefined, userId: string) {
  if (!classId) return;
  const result = await db.select({ id: classes.id }).from(classes).where(and(eq(classes.id, classId), eq(classes.userId, userId))).limit(1);
  if (!result[0]) throw new ApiError(403, "Этот предмет вам не принадлежит.");
}

export async function listAssignments(userId: string) {
  await ensureDatabase();
  const memberships = await membershipsFor(userId);
  const groupIds = memberships.map((item) => item.groupId);
  const access = groupIds.length
    ? or(eq(assignments.userId, userId), inArray(assignments.groupId, groupIds))
    : eq(assignments.userId, userId);
  const rows = await db.select().from(assignments).where(access).orderBy(asc(assignments.dueDate));
  return rows.map(assignmentToJson);
}

export async function createAssignment(userId: string, draft: Draft) {
  await ensureDatabase();
  if (draft.group_id && !(await isGroupStarosta(draft.group_id, userId))) {
    throw new ApiError(403, "Только староста может создавать задания для группы.");
  }
  await validateClass(draft.class_id, userId);
  const rows = await db
    .insert(assignments)
    .values({ ...databaseValues(draft), title: draft.title, subject: draft.subject, userId, status: "pending" })
    .returning();
  return assignmentToJson(rows[0]);
}

export async function createManyAssignments(userId: string, drafts: Draft[]) {
  await ensureDatabase();
  for (const draft of drafts) {
    if (draft.group_id && !(await isGroupStarosta(draft.group_id, userId))) {
      throw new ApiError(403, "Только староста может создавать задания для группы.");
    }
    await validateClass(draft.class_id, userId);
  }
  if (!drafts.length) return [];
  const rows = await db
    .insert(assignments)
    .values(drafts.map((draft) => ({ ...databaseValues(draft), title: draft.title, subject: draft.subject, userId, status: "pending" })))
    .returning();
  return rows.map(assignmentToJson);
}

async function writableAssignment(id: string, userId: string) {
  const rows = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
  const row = rows[0];
  if (!row) throw new ApiError(404, "Задание не найдено.");
  const allowed = row.userId === userId || (row.groupId ? await isGroupStarosta(row.groupId, userId) : false);
  if (!allowed) throw new ApiError(403, "У вас нет прав на изменение этого задания.");
  return row;
}

export async function updateAssignment(userId: string, id: string, patch: Patch) {
  await ensureDatabase();
  const current = await writableAssignment(id, userId);
  if (patch.group_id && !(await isGroupStarosta(patch.group_id, userId))) {
    throw new ApiError(403, "Только староста может назначать задание группе.");
  }
  await validateClass(patch.class_id, userId);
  const status = patch.status ?? current.status;
  const rows = await db
    .update(assignments)
    .set({
      ...databaseValues(patch),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      completedAt: status === "completed" ? current.completedAt || new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(assignments.id, id))
    .returning();
  return assignmentToJson(rows[0]);
}

export async function deleteAssignment(userId: string, id: string) {
  await ensureDatabase();
  await writableAssignment(id, userId);
  await db.delete(assignments).where(eq(assignments.id, id));
}
