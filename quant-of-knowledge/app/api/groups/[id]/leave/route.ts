import { json } from "@/lib/api/http";
import { withUser } from "@/lib/api/with-user";
import { leaveGroup } from "@/lib/server/groups";
import { idSchema } from "@/lib/server/validation";

export const POST = withUser<{ id: string }>({ name: "group-leave" }, async (_request, { user, params }) => {
  await leaveGroup(user.id, idSchema.parse(params.id));
  return json({ ok: true });
});
