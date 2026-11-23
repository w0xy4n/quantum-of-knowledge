import type { Assignment, Class, Group, GroupMember } from "@/lib/types";
import type { ScheduleEntry } from "@/lib/data/schedule";
import type { assignments, classes, groups, groupMembers, scheduleEntries } from "./schema";

type AssignmentRow = typeof assignments.$inferSelect;
type ClassRow = typeof classes.$inferSelect;
type GroupRow = typeof groups.$inferSelect;
type GroupMemberRow = typeof groupMembers.$inferSelect;
type ScheduleRow = typeof scheduleEntries.$inferSelect;

export function assignmentToJson(row: AssignmentRow): Assignment {
  return {
    id: row.id,
    user_id: row.userId,
    title: row.title,
    subject: row.subject,
    description: row.description,
    due_date: row.dueDate,
    priority: row.priority as Assignment["priority"],
    status: row.status as Assignment["status"],
    class_id: row.classId,
    group_id: row.groupId,
    image_url: row.imageUrl,
    attachment_urls: row.attachmentUrls ?? [],
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    completed_at: row.completedAt,
  };
}

export function classToJson(row: ClassRow) {
  return { id: row.id, user_id: row.userId, name: row.name, created_at: row.createdAt };
}

export function groupToJson(row: GroupRow) {
  return {
    id: row.id,
    name: row.name,
    invite_token: row.inviteToken,
    created_by: row.createdBy,
    created_at: row.createdAt,
  };
}

export function groupMemberToJson(row: GroupMemberRow) {
  return { group_id: row.groupId, user_id: row.userId, role: row.role, created_at: row.createdAt };
}

export function scheduleToJson(row: ScheduleRow) {
  return {
    id: row.id,
    user_id: row.userId,
    group_id: row.groupId,
    title: row.title,
    day_of_week: row.dayOfWeek,
    start_time: row.startTime,
    end_time: row.endTime,
    location: row.location,
    note: row.note,
    color: row.color,
    created_at: row.createdAt,
  };
}
