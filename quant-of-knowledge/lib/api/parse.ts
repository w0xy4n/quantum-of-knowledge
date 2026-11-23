import type { z } from "zod";
import { ApiError, jsonBody } from "./http";

export async function validatedBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  const parsed = schema.safeParse(await jsonBody(request));
  if (!parsed.success) throw new ApiError(400, "Проверьте заполненные поля и повторите запрос.");
  return parsed.data;
}
