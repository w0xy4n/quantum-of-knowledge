import { AssignmentWriteError } from "@/lib/data/assignments";
import { apiRequest } from "@/lib/api/client";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
export async function uploadAssignmentImage(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new AssignmentWriteError("Файл слишком большой — максимум 50 МБ.");
  const form = new FormData();
  form.append("file", file);
  try {
    const result = await apiRequest<{ url: string }>("/api/files", { method: "POST", body: form });
    return result.url;
  } catch (error) {
    throw new AssignmentWriteError(error instanceof Error ? error.message : "Не удалось загрузить файл.", error);
  }
}
