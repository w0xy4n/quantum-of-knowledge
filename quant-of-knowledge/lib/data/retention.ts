import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, ensureDatabase } from "@/lib/db";
import { assignments, retentionSettings } from "@/lib/db/schema";
import {
  DEFAULT_RETENTION,
  expiredAssignmentIds,
  toRetentionPolicy,
  type RetentionPolicy,
} from "@/lib/data/retention-policy";

export { expiredAssignmentIds };
export type { RetentionPolicy };

export async function readRetentionPolicy(userId: string): Promise<RetentionPolicy> {
  try {
    await ensureDatabase();
    const rows = await db
      .select()
      .from(retentionSettings)
      .where(eq(retentionSettings.userId, userId))
      .limit(1);
    const row = rows[0];
    return toRetentionPolicy(row ? { enabled: row.enabled, delete_after_days: row.deleteAfterDays } : null);
  } catch (error) {
    console.error("Could not read retention settings; keeping everything this time:", error);
    return { enabled: false, deleteAfterDays: DEFAULT_RETENTION.deleteAfterDays };
  }
}

export async function deleteExpiredAssignments(userId: string, ids: readonly string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  try {
    await ensureDatabase();
    const rows = await db
      .delete(assignments)
      .where(and(eq(assignments.userId, userId), inArray(assignments.id, [...ids])))
      .returning({ id: assignments.id });
    return new Set(rows.map((row) => row.id));
  } catch (error) {
    console.error("Could not delete expired assignments:", error);
    return new Set();
  }
}
