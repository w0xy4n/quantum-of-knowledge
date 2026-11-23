import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ApiError, json } from "@/lib/api/http";
import { withUser } from "@/lib/api/with-user";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const POST = withUser({ name: "file-upload", perUser: { limit: 30, windowMs: 60_000 } }, async (request, { user }) => {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "Выберите файл для загрузки.");
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) throw new ApiError(413, "Файл слишком большой — максимум 50 МБ.");
  const extension = file.name.split(".").pop()?.toLowerCase().match(/^[a-z0-9]{1,12}$/)?.[0] || "bin";
  const filename = `${randomUUID()}.${extension}`;
  const directory = path.resolve(process.env.UPLOAD_DIR || "./data/uploads", user.id);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()), { flag: "wx" });
  return json({ url: `/api/files/${encodeURIComponent(user.id)}/${filename}` }, { status: 201 });
});
