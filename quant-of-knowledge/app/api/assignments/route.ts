import { z } from "zod";
import { json } from "@/lib/api/http";
import { validatedBody } from "@/lib/api/parse";
import { withUser } from "@/lib/api/with-user";
import { createAssignment, createManyAssignments, listAssignments } from "@/lib/server/assignments";
import { assignmentDraftSchema } from "@/lib/server/validation";

export const GET = withUser({ name: "assignments-read" }, async (_request, { user }) => {
  return json(await listAssignments(user.id));
});

export const POST = withUser({ name: "assignments-write" }, async (request, { user }) => {
  const body = await validatedBody(request, z.union([assignmentDraftSchema, z.array(assignmentDraftSchema).max(500)]));
  const result = Array.isArray(body) ? await createManyAssignments(user.id, body) : await createAssignment(user.id, body);
  return json(result, { status: 201 });
});
