import { and, eq } from "drizzle-orm";
import { ApiError, json } from "@/lib/api/http";
import { validatedBody } from "@/lib/api/parse";
import { withUser } from "@/lib/api/with-user";
import { db, ensureDatabase } from "@/lib/db";
import { classToJson } from "@/lib/db/serialize";
import { assignments, classes } from "@/lib/db/schema";
import { classNameSchema, idSchema } from "@/lib/server/validation";

export const PATCH = withUser<{ id: string }>({ name: "class-update" }, async (request, { user, params }) => {
  await ensureDatabase();
  const id = idSchema.parse(params.id);
  const { name } = await validatedBody(request, classNameSchema);
  const rows = await db.transaction(async (tx) => {
    const updated = await tx.update(classes).set({ name }).where(and(eq(classes.id, id), eq(classes.userId, user.id))).returning();
    if (!updated[0]) throw new ApiError(404, "Предмет не найден.");
    await tx.update(assignments).set({ subject: name, updatedAt: new Date().toISOString() }).where(and(eq(assignments.classId, id), eq(assignments.userId, user.id)));
    return updated;
  });
  return json(classToJson(rows[0]));
});

export const DELETE = withUser<{ id: string }>({ name: "class-delete" }, async (_request, { user, params }) => {
  await ensureDatabase();
  const id = idSchema.parse(params.id);
  const rows = await db.delete(classes).where(and(eq(classes.id, id), eq(classes.userId, user.id))).returning({ id: classes.id });
  if (!rows[0]) throw new ApiError(404, "Предмет не найден.");
  return json({ ok: true });
});
