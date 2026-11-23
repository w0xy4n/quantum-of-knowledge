import { eq } from "drizzle-orm";
import { z } from "zod";
import { json } from "@/lib/api/http";
import { validatedBody } from "@/lib/api/parse";
import { withUser } from "@/lib/api/with-user";
import { db, ensureDatabase } from "@/lib/db";
import { user } from "@/lib/db/schema";

export const PATCH = withUser({ name: "profile-update" }, async (request, { user: current }) => {
  await ensureDatabase();
  const body = await validatedBody(request, z.object({ fullName: z.string().trim().max(200), nickname: z.string().trim().max(50) }));
  const name = body.fullName || current.email.split("@")[0] || "Пользователь";
  await db.update(user).set({ name, nickname: body.nickname || null, updatedAt: new Date() }).where(eq(user.id, current.id));
  return json({ ok: true });
});
