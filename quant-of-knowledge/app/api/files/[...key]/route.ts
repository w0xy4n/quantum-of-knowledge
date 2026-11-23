import { readFile } from "node:fs/promises";
import path from "node:path";
import { ApiError } from "@/lib/api/http";
import { withUser } from "@/lib/api/with-user";
import { listAssignments } from "@/lib/server/assignments";

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", pdf: "application/pdf",
  txt: "text/plain; charset=utf-8", csv: "text/csv; charset=utf-8", zip: "application/zip",
};

export const GET = withUser<{ key: string[] }>({ name: "file-read", perUser: { limit: 300, windowMs: 60_000 } }, async (_request, { user, params }) => {
  if (params.key.length !== 2) throw new ApiError(404, "Файл не найден.");
  const [owner, filename] = params.key;
  if (!/^[A-Za-z0-9_-]+$/.test(owner) || !/^[a-f0-9-]{36}\.[a-z0-9]{1,12}$/i.test(filename)) throw new ApiError(404, "Файл не найден.");
  const url = `/api/files/${encodeURIComponent(owner)}/${filename}`;
  if (owner !== user.id) {
    const visible = await listAssignments(user.id);
    if (!visible.some((assignment) => assignment.image_url === url || assignment.attachment_urls.includes(url))) {
      throw new ApiError(403, "У вас нет доступа к этому файлу.");
    }
  }
  const root = path.resolve(process.env.UPLOAD_DIR || "./data/uploads");
  const target = path.resolve(root, owner, filename);
  if (!target.startsWith(`${root}${path.sep}`)) throw new ApiError(404, "Файл не найден.");
  const bytes = await readFile(target).catch(() => null);
  if (!bytes) throw new ApiError(404, "Файл не найден.");
  const extension = filename.split(".").pop()?.toLowerCase() || "bin";
  const mime = MIME[extension] || "application/octet-stream";
  const disposition = mime === "application/octet-stream" ? "attachment" : "inline";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": mime,
      "content-disposition": `${disposition}; filename="${filename}"`,
      "cache-control": "private, max-age=3600",
      "x-content-type-options": "nosniff",
    },
  });
});
