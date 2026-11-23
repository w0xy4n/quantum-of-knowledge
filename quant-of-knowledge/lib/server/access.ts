import "server-only";
import { and, eq } from "drizzle-orm";
import { db, ensureDatabase } from "@/lib/db";
import { groupMembers } from "@/lib/db/schema";

export async function membershipsFor(userId: string) {
  await ensureDatabase();
  return db.select().from(groupMembers).where(eq(groupMembers.userId, userId));
}

export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  await ensureDatabase();
  const rows = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function isGroupStarosta(groupId: string, userId: string): Promise<boolean> {
  await ensureDatabase();
  const rows = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return rows[0]?.role === "starosta";
}
