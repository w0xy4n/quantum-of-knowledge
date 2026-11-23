import type { AssignmentDraft } from "@/lib/data/assignments";
import type { Priority } from "@/lib/types";

/**
 * What a parser produces: exactly the fields a user fills in on the add form.
 *
 * Aliased rather than redeclared. This shape used to be written out a second
 * time in `settings-content.tsx`, which meant adding a column to the form left
 * the importer silently one field behind. A type-only import, so nothing in the
 * data layer is pulled into the parser's runtime graph.
 */
export type ParsedAssignment = AssignmentDraft;

/** One item from a Canvas export, normalised across the shapes the various files use. */
export interface CanvasItem {
  title?: string | null;
  subject?: string | null;
  description?: string | null;
  dueAt?: string | null;
  pointsPossible?: number;
  priority?: Priority;
}

/**
 * Why a file could not be read.
 *
 * A file that parses but contains no assignments is **not** a failure — it is
 * `ok` with an empty array. The two cases need different words in the UI: "we
 * could not read this file" and "we read it, there was nothing in it" send a
 * student to different places, and collapsing them is what the old single
 * catch-all message did.
 */
export type ParseFailure =
  | { kind: "unsupported-format"; extension: string }
  | { kind: "invalid-json"; message: string }
  | { kind: "invalid-xml" }
  | { kind: "no-course-data" };

export type ParseResult = { ok: true; assignments: ParsedAssignment[] } | { ok: false; reason: ParseFailure };

export function ok(assignments: ParsedAssignment[]): ParseResult {
  return { ok: true, assignments };
}

export function fail(reason: ParseFailure): ParseResult {
  return { ok: false, reason };
}

/** The message shown under the upload box. Kept next to the failure kinds so a new kind cannot be forgotten. */
export function describeParseFailure(reason: ParseFailure): string {
  switch (reason.kind) {
    case "unsupported-format":
      return `Квант-знаний не умеет читать файлы ${reason.extension}. Экспортируйте курс как JS (course-data.js), JSON или XML и попробуйте снова.`;
    case "invalid-json":
      return "Этот файл — некорректный JSON, прочитать его не удалось. Если вы редактировали его вручную, проверьте, не потерялась ли запятая или скобка.";
    case "invalid-xml":
      return "Этот файл — некорректный XML, прочитать его не удалось.";
    case "no-course-data":
      return "В этом JavaScript-файле нет объекта COURSE_DATA. Убедитесь, что это именно тот course-data.js, который выдал Canvas.";
  }
}
