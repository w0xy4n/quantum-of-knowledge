import { rm } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { json } from "@/lib/api/http";
import { withUser } from "@/lib/api/with-user";
import { db, ensureDatabase } from "@/lib/db";
import { user } from "@/lib/db/schema";

export const POST = withUser({ name: "account-delete", perUser: { limit: 5, windowMs: 60_000 } }, async (request, { user: current }) => {
  await ensureDatabase();
  const signedOut = await auth.api.signOut({ headers: request.headers, asResponse: true });
  await db.delete(user).where(eq(user.id, current.id));
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR || "./data/uploads");
  const directory = path.resolve(uploadRoot, current.id);
  if (directory.startsWith(`${uploadRoot}${path.sep}`)) await rm(directory, { recursive: true, force: true });
  return json({ ok: true }, { headers: signedOut.headers });
});
