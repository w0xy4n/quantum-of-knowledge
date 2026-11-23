import { z } from "zod";
import { json } from "@/lib/api/http";
import { validatedBody } from "@/lib/api/parse";
import { withUser } from "@/lib/api/with-user";
import { createGroup, listGroups } from "@/lib/server/groups";

export const GET = withUser({ name: "groups-read" }, async (request, { user }) => {
  const includeMembers = new URL(request.url).searchParams.get("includeMembers") === "1";
  return json(await listGroups(user.id, includeMembers));
});
export const POST = withUser({ name: "groups-write" }, async (request, { user }) => {
  const body = await validatedBody(request, z.object({ name: z.string().trim().min(1).max(100) }));
  return json(await createGroup(user.id, body.name), { status: 201 });
});
