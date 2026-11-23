import { deleteExpiredAssignments, expiredAssignmentIds, readRetentionPolicy } from "@/lib/data/retention";
import { listAssignments } from "@/lib/server/assignments";
import type { Assignment } from "@/lib/types";

export interface DashboardData {
  assignments: Assignment[];
}

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const [assignments, policy] = await Promise.all([listAssignments(userId), readRetentionPolicy(userId)]);
  const expired = expiredAssignmentIds(assignments, policy);
  if (!expired.length) return { assignments };
  const deleted = await deleteExpiredAssignments(userId, expired);
  return { assignments: assignments.filter((assignment) => !deleted.has(assignment.id)) };
}
