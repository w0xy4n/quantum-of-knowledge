"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { AssignmentsBoard, useTabState } from "@/components/assignments/assignments-board";
import { PreviewAddAssignmentDialog } from "@/components/preview-add-assignment-dialog";
import { WeeklyView } from "@/components/weekly-view";
import type { Assignment, Status } from "@/lib/types";

export function PreviewAssignmentsList({ initialAssignments }: { initialAssignments: Assignment[] }) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [tab, setTab] = useTabState(null);

  const handleAdd = (assignment: Assignment) => {
    setAssignments((previous) => [assignment, ...previous]);
  };

  const handleStatusChange = (id: string, status: Status) => {
    const completed_at = status === "completed" ? new Date().toISOString() : null;
    setAssignments((previous) => previous.map((a) => (a.id === id ? { ...a, status, completed_at } : a)));
  };

  const handleDelete = (id: string) => {
    setAssignments((previous) => previous.filter((a) => a.id !== id));
  };

  return (
    <AssignmentsBoard
      assignments={assignments}
      tab={tab}
      onTabChange={setTab}
      action={<PreviewAddAssignmentDialog onAdd={handleAdd} />}
      weeklyView={<WeeklyView assignments={assignments} />}
      banner={
        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] px-4 py-3.5 text-sm text-accent-foreground sm:items-center">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary sm:mt-0" />
          <p>
            <span className="font-bold">Режим предпросмотра.</span>{" "}
            <span className="text-muted-foreground">
              Изменения не сохраняются — войдите, чтобы сохранять свои данные.
            </span>
          </p>
        </div>
      }
      preview={{ onStatusChange: handleStatusChange, onDelete: handleDelete }}
    />
  );
}
