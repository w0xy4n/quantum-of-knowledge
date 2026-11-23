import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { ApiError } from "@/lib/api/http";
import { db, ensureDatabase } from "@/lib/db";
import { groupMemberToJson, groupToJson } from "@/lib/db/serialize";
import { groupMembers, groups, user } from "@/lib/db/schema";

export async function listGroups(userId: string, includeMembers = false) {
  await ensureDatabase();
  const rows = await db
    .select({ membership: groupMembers, group: groups })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId));
  const memberships = rows.map(({ membership, group }) => ({
    ...groupMemberToJson(membership),
    groups: groupToJson(group),
  }));
  if (!includeMembers || !rows.length) return { userId, memberships, members: {} };
  const groupIds = rows.map((row) => row.group.id);
  const memberRows = await db
    .select({ membership: groupMembers, name: user.name, nickname: user.nickname, email: user.email })
    .from(groupMembers)
    .innerJoin(user, eq(user.id, groupMembers.userId))
    .where(inArray(groupMembers.groupId, groupIds));
  const members: Record<string, unknown[]> = {};
  for (const row of memberRows) {
    (members[row.membership.groupId] ??= []).push({
      user_id: row.membership.userId,
      role: row.membership.role,
      email: row.email,
      full_name: row.name,
      nickname: row.nickname,
      joined_at: row.membership.createdAt,
    });
  }
  return { userId, memberships, members };
}

export async function createGroup(userId: string, name: string) {
  await ensureDatabase();
  return db.transaction(async (tx) => {
    const created = await tx.insert(groups).values({ name, createdBy: userId, inviteToken: randomUUID() }).returning();
    await tx.insert(groupMembers).values({ groupId: created[0].id, userId, role: "starosta" });
    return groupToJson(created[0]);
  });
}

export async function joinGroup(userId: string, token: string) {
  await ensureDatabase();
  const found = await db.select().from(groups).where(eq(groups.inviteToken, token)).limit(1);
  if (!found[0]) throw new ApiError(404, "Группа не найдена или ссылка устарела.");
  const group = found[0];
  const existing = await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, userId))).limit(1);
  if (existing[0]) return { ok: true, already_member: true, group_name: group.name };
  await db.insert(groupMembers).values({ groupId: group.id, userId, role: "member" });
  return { ok: true, already_member: false, group_name: group.name };
}

export async function leaveGroup(userId: string, groupId: string) {
  await ensureDatabase();
  const rows = await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))).limit(1);
  if (!rows[0]) throw new ApiError(404, "Вы не состоите в этой группе.");
  if (rows[0].role === "starosta") throw new ApiError(409, "Староста может удалить группу, но не выйти из неё.");
  await db.delete(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
}

export async function deleteGroup(userId: string, groupId: string) {
  await ensureDatabase();
  const rows = await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))).limit(1);
  if (rows[0]?.role !== "starosta") throw new ApiError(403, "Только староста может удалить группу.");
  // ON DELETE SET NULL keeps the owner's assignments as personal ones.
  await db.delete(groups).where(eq(groups.id, groupId));
}
