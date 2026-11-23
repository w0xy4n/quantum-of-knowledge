import { z } from "zod";
import { json } from "@/lib/api/http";
import { validatedBody } from "@/lib/api/parse";
import { withUser } from "@/lib/api/with-user";
import { createScheduleEntry, listSchedule } from "@/lib/server/schedule";
import { scheduleDraftSchema } from "@/lib/server/validation";

const scopeSchema = z.object({ userId: z.string().optional(), groupId: z.string().uuid().optional() }).refine((value) => Boolean(value.userId) !== Boolean(value.groupId));

export const GET = withUser({ name: "schedule-read" }, async (request, { user }) => {
  const url = new URL(request.url);
  const scope = scopeSchema.parse({ userId: url.searchParams.get("userId") || undefined, groupId: url.searchParams.get("groupId") || undefined });
  return json(await listSchedule(user.id, scope));
});

export const POST = withUser({ name: "schedule-write" }, async (request, { user }) => {
  const body = await validatedBody(request, z.object({ scope: scopeSchema, entry: scheduleDraftSchema }));
  return json(await createScheduleEntry(user.id, body.scope, body.entry), { status: 201 });
});
