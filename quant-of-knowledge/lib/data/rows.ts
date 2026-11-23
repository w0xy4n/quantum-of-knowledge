import type { Assignment } from "@/lib/types";

/** Runtime data arrives from our API, whose database constraints narrow these unions. */
export function toAssignment(row: Assignment): Assignment {
  return row;
}

export function toAssignments(rows: Assignment[] | null): Assignment[] {
  return rows ?? [];
}
