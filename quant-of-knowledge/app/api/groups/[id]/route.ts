import { json } from "@/lib/api/http";
import { withUser } from "@/lib/api/with-user";
import { deleteGroup } from "@/lib/server/groups";
import { idSchema } from "@/lib/server/validation";

export const DELETE = withUser<{ id: string }>({ name: "group-delete" }, async (_request, { user, params }) => {
  await deleteGroup(user.id, idSchema.parse(params.id));
  return json({ ok: true });
});
