export interface RetentionPolicy {
  readonly enabled: boolean;
  readonly deleteAfterDays: number;
}

export const DEFAULT_RETENTION: RetentionPolicy = { enabled: true, deleteAfterDays: 30 };
export const MIN_RETENTION_DAYS = 1;
export const MAX_RETENTION_DAYS = 3650;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface RetentionCandidate {
  readonly id: string;
  readonly status: string;
  readonly completed_at: string | null;
}

export function isValidRetentionDays(days: number): boolean {
  return Number.isInteger(days) && days >= MIN_RETENTION_DAYS && days <= MAX_RETENTION_DAYS;
}

export function retentionCutoff(policy: RetentionPolicy, now: Date = new Date()): Date | null {
  if (!policy.enabled || !isValidRetentionDays(policy.deleteAfterDays)) return null;
  return new Date(now.getTime() - policy.deleteAfterDays * MS_PER_DAY);
}

export function expiredAssignmentIds(
  assignments: readonly RetentionCandidate[],
  policy: RetentionPolicy,
  now: Date = new Date(),
): string[] {
  const cutoff = retentionCutoff(policy, now);
  if (!cutoff) return [];
  return assignments
    .filter((assignment) => {
      if (assignment.status !== "completed" || !assignment.completed_at) return false;
      const completedAt = new Date(assignment.completed_at);
      return !Number.isNaN(completedAt.getTime()) && completedAt.getTime() < cutoff.getTime();
    })
    .map((assignment) => assignment.id);
}

export function describeRetention(policy: RetentionPolicy): string {
  if (!policy.enabled) return "Выполненные задания хранятся, пока вы не удалите их сами.";
  const { deleteAfterDays: days } = policy;
  if (days === 1) return "Выполненные задания удаляются через день после отметки.";
  if (days === 7) return "Выполненные задания удаляются через неделю после отметки.";
  if (days === 30) return "Выполненные задания удаляются через месяц после отметки.";
  if (days === 365) return "Выполненные задания удаляются через год после отметки.";
  if (days % 7 === 0 && days < 70) return `Выполненные задания удаляются через ${days / 7} нед. после отметки.`;
  return `Выполненные задания удаляются через ${days} дн. после отметки.`;
}

export function toRetentionPolicy(
  row: { enabled: boolean; delete_after_days: number } | null,
): RetentionPolicy {
  if (!row) return DEFAULT_RETENTION;
  return {
    enabled: row.enabled,
    deleteAfterDays: isValidRetentionDays(row.delete_after_days)
      ? row.delete_after_days
      : DEFAULT_RETENTION.deleteAfterDays,
  };
}
