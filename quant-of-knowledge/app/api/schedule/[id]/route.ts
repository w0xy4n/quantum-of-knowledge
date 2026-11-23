import { json } from "@/lib/api/http";
import { validatedBody } from "@/lib/api/parse";
import { withUser } from "@/lib/api/with-user";
import { deleteScheduleEntry, updateScheduleEntry } from "@/lib/server/schedule";
import { idSchema, scheduleDraftSchema } from "@/lib/server/validation";

export const PATCH = withUser<{ id: string }>({ name: "schedule-update" }, async (request, { user, params }) => {
  return json(await updateScheduleEntry(user.id, idSchema.parse(params.id), await validatedBody(request, scheduleDraftSchema)));
});
export const DELETE = withUser<{ id: string }>({ name: "schedule-delete" }, async (_request, { user, params }) => {
  await deleteScheduleEntry(user.id, idSchema.parse(params.id));
  return json({ ok: true });
});
