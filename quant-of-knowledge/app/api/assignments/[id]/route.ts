import { json } from "@/lib/api/http";
import { validatedBody } from "@/lib/api/parse";
import { withUser } from "@/lib/api/with-user";
import { deleteAssignment, updateAssignment } from "@/lib/server/assignments";
import { assignmentPatchSchema, idSchema } from "@/lib/server/validation";

export const PATCH = withUser<{ id: string }>({ name: "assignment-update" }, async (request, { user, params }) => {
  const id = idSchema.parse(params.id);
  return json(await updateAssignment(user.id, id, await validatedBody(request, assignmentPatchSchema)));
});

export const DELETE = withUser<{ id: string }>({ name: "assignment-delete" }, async (_request, { user, params }) => {
  await deleteAssignment(user.id, idSchema.parse(params.id));
  return json({ ok: true });
});
