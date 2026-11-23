/**
 * Работа со списком вложений задания.
 *
 * Старые строки хранят одну ссылку в `image_url`, новые — массив в
 * `attachment_urls` (первое вложение дублируется в `image_url`). Все читатели
 * идут через `assignmentAttachments`, чтобы не помнить про оба формата.
 */

export const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "mkv", "avi"]);
export const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "heic", "bmp"]);

export type AttachmentKind = "video" | "image" | "file";

export function attachmentKind(url: string): AttachmentKind {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  return "file";
}

/** Расширение файла из ссылки — для подписи «PDF», «DOCX» и т.п. */
export function attachmentExt(url: string): string {
  return url.split("?")[0].split(".").pop()?.toUpperCase() ?? "FILE";
}

/** Все вложения задания, независимо от того, какой колонкой они записаны. */
export function assignmentAttachments(assignment: {
  attachment_urls?: string[] | null;
  image_url?: string | null;
}): string[] {
  if (assignment.attachment_urls && assignment.attachment_urls.length > 0) {
    return assignment.attachment_urls;
  }
  return assignment.image_url ? [assignment.image_url] : [];
}

/** Русское склонение: 1 файл, 2 файла, 5 файлов. */
export function attachmentsCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} файл`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} файла`;
  return `${count} файлов`;
}
