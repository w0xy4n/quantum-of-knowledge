import { asc, eq } from "drizzle-orm";
import { ApiError, json } from "@/lib/api/http";
import { validatedBody } from "@/lib/api/parse";
import { withUser } from "@/lib/api/with-user";
import { db, ensureDatabase } from "@/lib/db";
import { classToJson } from "@/lib/db/serialize";
import { classes } from "@/lib/db/schema";
import { classNameSchema } from "@/lib/server/validation";

export const GET = withUser({ name: "classes-read" }, async (_request, { user }) => {
  await ensureDatabase();
  const rows = await db.select().from(classes).where(eq(classes.userId, user.id)).orderBy(asc(classes.name));
  return json(rows.map(classToJson));
});

export const POST = withUser({ name: "classes-write" }, async (request, { user }) => {
  await ensureDatabase();
  const { name } = await validatedBody(request, classNameSchema);
  try {
    const rows = await db.insert(classes).values({ userId: user.id, name }).returning();
    return json(classToJson(rows[0]), { status: 201 });
  } catch (error) {
    if (String(error).includes("classes_user_name_unique")) {
      throw new ApiError(409, "Предмет с таким названием уже существует.");
    }
    throw error;
  }
});
