import { eq } from "drizzle-orm";
import { json } from "@/lib/api/http";
import { withUser } from "@/lib/api/with-user";
import { db, ensureDatabase } from "@/lib/db";
import { assignmentToJson, classToJson, groupToJson, scheduleToJson } from "@/lib/db/serialize";
import { assignments, classes, groups, scheduleEntries } from "@/lib/db/schema";
import { readRetentionPolicy } from "@/lib/data/retention";

export const GET = withUser({ name: "account-export", perUser: { limit: 10, windowMs: 60_000 } }, async (_request, { user }) => {
  await ensureDatabase();
  const [assignmentRows, classRows, groupRows, scheduleRows, retention] = await Promise.all([
    db.select().from(assignments).where(eq(assignments.userId, user.id)),
    db.select().from(classes).where(eq(classes.userId, user.id)),
    db.select().from(groups).where(eq(groups.createdBy, user.id)),
    db.select().from(scheduleEntries).where(eq(scheduleEntries.userId, user.id)),
    readRetentionPolicy(user.id),
  ]);
  return json({
    exported_at: new Date().toISOString(),
    account: {
      id: user.id, email: user.email, display_name: user.user_metadata.full_name,
      nickname: user.user_metadata.nickname, avatar_url: user.user_metadata.avatar_url,
      phone: user.phone, provider: user.app_metadata.provider, created_at: user.created_at,
    },
    assignments: assignmentRows.map(assignmentToJson),
    classes: classRows.map(classToJson),
    groups: groupRows.map(groupToJson),
    schedule_entries: scheduleRows.map(scheduleToJson),
    retention,
  });
});
