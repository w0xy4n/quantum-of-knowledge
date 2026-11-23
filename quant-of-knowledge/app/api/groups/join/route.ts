import { z } from "zod";
import { json } from "@/lib/api/http";
import { validatedBody } from "@/lib/api/parse";
import { withUser } from "@/lib/api/with-user";
import { joinGroup } from "@/lib/server/groups";

export const POST = withUser({ name: "groups-join", perAddress: { limit: 30, windowMs: 60_000 } }, async (request, { user }) => {
  const { token } = await validatedBody(request, z.object({ token: z.string().trim().min(1).max(200) }));
  return json(await joinGroup(user.id, token));
});
