"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, CheckCircle2, Clock, Infinity as InfinityIcon, Pencil, Users } from "lucide-react";
import { useState } from "react";
import { AssignmentAttachments } from "@/components/assignment-attachment";
import { AssignmentForm, type AssignmentFormPayload, assignmentToForm } from "@/components/assignments/assignment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAssignmentMutation } from "@/hooks/use-assignment-mutation";
import { useClasses, useSubjectOptions } from "@/hooks/use-classes";
import { useGroupNames } from "@/hooks/use-group-names";
import { assignmentAttachments } from "@/lib/attachments";
import { setAssignmentStatus, updateAssignment } from "@/lib/data/assignments";
import { resolveClassId } from "@/lib/data/classes";
import { isAssignmentOverdue, isValidDate, parseDueDate } from "@/lib/dates";
import { uploadAssignmentImage } from "@/lib/storage";
import type { Assignment } from "@/lib/types";

const priorityLabels = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
} as const;

const priorityColors = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
} as const;

const statusLabels = {
  pending: "В работе",
  completed: "Выполнено",
  overdue: "Просрочено",
} as const;

const statusColors = {
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  overdue: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
} as const;

interface AssignmentDetailsDialogProps {
  assignment: Assignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Владелец может редактировать и отмечать выполненным; гость группы — только читать. */
  isOwner: boolean;
  isPreview?: boolean;
}

/** Большое окно задания: удобно прочитать всё целиком, а владельцу — тут же
 *  отредактировать или отметить выполненным, без отдельной страницы. */
export function AssignmentDetailsDialog({
  assignment,
  open,
  onOpenChange,
  isOwner,
  isPreview = false,
}: AssignmentDetailsDialogProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const subjectOptions = useSubjectOptions();
  const { data: classes } = useClasses();
  const { runMutation, isPending } = useAssignmentMutation();

  const isGroupTask = Boolean(assignment.group_id);
  const groupNames = useGroupNames();
  const groupName = assignment.group_id ? (groupNames[assignment.group_id] ?? null) : null;
  const dueDate = parseDueDate(assignment.due_date);
  const isOverdue = isAssignmentOverdue(assignment);
  const status = isOverdue ? "overdue" : assignment.status;

  const close = (next: boolean) => {
    if (!next) setMode("view");
    onOpenChange(next);
  };

  const handleComplete = async () => {
    const saved = await runMutation(
      () => setAssignmentStatus(assignment.id, "completed"),
      "Не удалось отметить как выполненное",
    );
    if (saved) close(false);
  };

  const handleReopen = async () => {
    const saved = await runMutation(
      () => setAssignmentStatus(assignment.id, "pending"),
      "Не удалось вернуть задание в работу",
    );
    if (saved) close(false);
  };

  const handleSave = async (payload: AssignmentFormPayload) => {
    // Новые файлы догружаем и склеиваем с оставленными, как в EditAssignmentDialog.
    const { files, keepUrls, ...fields } = payload;
    const linked = { ...fields, class_id: resolveClassId(fields.subject, classes) };
    const saved = await runMutation(async () => {
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push(await uploadAssignmentImage(file));
      }
      const attachment_urls = [...keepUrls, ...uploaded];
      // Как и в EditAssignmentDialog: без вложений колонку не трогаем,
      // чтобы запись не зависела от свежей миграции.
      const attachmentsPatch =
        attachment_urls.length > 0 || assignmentAttachments(assignment).length > 0
          ? { attachment_urls, image_url: attachment_urls[0] ?? null }
          : {};
      await updateAssignment(assignment.id, { ...linked, ...attachmentsPatch });
    }, "Не удалось сохранить изменения");
    if (saved) close(false);
    return saved;
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      {/* Ширину ограничиваем только сверху: ползунок появляется у оверлея
          (grid-раскладка в dialog.tsx), а не внутри самого окна. */}
      <DialogContent className="sm:max-w-[560px]">
        {mode === "edit" && isOwner && !isPreview ? (
          <>
            <DialogHeader>
              <DialogTitle>Редактировать задание</DialogTitle>
              <DialogDescription>Измените детали задания ниже.</DialogDescription>
            </DialogHeader>
            <AssignmentForm
              initialValues={assignmentToForm(assignment)}
              subjectOptions={subjectOptions}
              submitLabel="Сохранить"
              pendingLabel="Сохранение..."
              isPending={isPending}
              onSubmit={handleSave}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 pr-6">
                {isGroupTask && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300"
                  >
                    <Users className="mr-1 h-3 w-3" />
                    {groupName ?? "Группа"}
                  </Badge>
                )}
                <Badge variant="secondary" className={`text-xs ${priorityColors[assignment.priority]}`}>
                  {priorityLabels[assignment.priority]}
                </Badge>
                <Badge variant="secondary" className={`text-xs ${statusColors[status]}`}>
                  {statusLabels[status]}
                </Badge>
              </div>
              <DialogTitle className="text-xl leading-snug break-words">{assignment.title}</DialogTitle>
              <DialogDescription className="text-base">{assignment.subject}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 min-w-0">
              {isValidDate(dueDate) ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  Сдать до: {format(dueDate, "d MMMM yyyy, HH:mm", { locale: ru })}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <InfinityIcon className="h-4 w-4 shrink-0" />
                  Бессрочное задание — срока сдачи нет
                </div>
              )}

              {assignment.description && (
                <div className="min-w-0">
                  <p className="mb-1 text-sm font-medium">Описание</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {assignment.description}
                  </p>
                </div>
              )}

              <AssignmentAttachments urls={assignmentAttachments(assignment)} title={assignment.title} large />

              {isOwner && !isPreview && (
                <div className="flex flex-wrap gap-2 border-t pt-4">
                  <Button variant="outline" size="sm" onClick={() => setMode("edit")}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Редактировать
                  </Button>
                  {assignment.status !== "completed" ? (
                    <Button variant="outline" size="sm" onClick={handleComplete} disabled={isPending}>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                      Отметить выполненным
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleReopen} disabled={isPending}>
                      <Clock className="mr-2 h-4 w-4" />
                      Вернуть в работу
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
