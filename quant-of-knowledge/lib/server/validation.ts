import { z } from "zod";

export const idSchema = z.string().uuid();
export const assignmentFields = {
  title: z.string().trim().min(1).max(300),
  subject: z.string().trim().min(1).max(200),
  description: z.string().max(20_000).nullable(),
  due_date: z.string().max(80).nullable(),
  priority: z.enum(["low", "medium", "high"]),
  class_id: z.string().uuid().nullable().optional(),
  group_id: z.string().uuid().nullable().optional(),
  image_url: z.string().max(2048).nullable().optional(),
  attachment_urls: z.array(z.string().max(2048)).max(20).optional(),
};
export const assignmentDraftSchema = z.object(assignmentFields);
export const assignmentPatchSchema = assignmentDraftSchema.partial().extend({ status: z.enum(["pending", "completed"]).optional() });
export const classNameSchema = z.object({ name: z.string().trim().min(1).max(100) });
export const scheduleDraftSchema = z.object({
  title: z.string().trim().min(1).max(300),
  day_of_week: z.number().int().min(1).max(7),
  start_time: z.string().regex(/^\d{2}:\d{2}(?::\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(?::\d{2})?$/).nullable().optional(),
  location: z.string().max(300).nullable().optional(),
  note: z.string().max(5000).nullable().optional(),
  color: z.enum(["default", "blue", "emerald", "amber", "rose", "violet"]).nullable().optional(),
});
