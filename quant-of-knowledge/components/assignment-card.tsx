"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { lazy, Suspense, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { useTimeZone } from "@/components/timezone-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAssignmentMutation } from "@/hooks/use-assignment-mutation";
import { useGroupNames } from "@/hooks/use-group-names";
import { assignmentAttachments, attachmentKind, attachmentsCountLabel } from "@/lib/attachments";
import { AssignmentWriteError, deleteAssignment, setAssignmentStatus } from "@/lib/data/assignments";
import { dueDateLabel, isAssignmentOverdue, parseDueDate } from "@/lib/dates";
import { ASSIGNMENTS_KEY } from "@/lib/swr-keys";
import type { Assignment } from "@/lib/types";

const EditAssignmentDialog = lazy(() =>
  import("./edit-assignment-dialog").then((mod) => ({ default: mod.EditAssignmentDialog })),
);
const AssignmentDetailsDialog = lazy(() =>
  import("./assignment-details-dialog").then((mod) => ({ default: mod.AssignmentDetailsDialog })),
);

const KIND_ICONS = { video: Video, image: ImageIcon, file: FileText } as const;

interface AssignmentCardProps {
  assignment: Assignment;
  isPreview?: boolean;
  /** Id текущего пользователя. Не совпал с автором — это групповое задание,
   *  которое можно только смотреть: RLS всё равно не даст его изменить. */
  currentUserId?: string;
  onPreviewStatusChange?: (id: string, status: "pending" | "completed") => void;
  onPreviewDelete?: (id: string) => void;
}

export function AssignmentCard({
  assignment,
  isPreview = false,
  currentUserId,
  onPreviewStatusChange,
  onPreviewDelete,
}: AssignmentCardProps) {
  const { mutate } = useSWRConfig();
  const { runMutation } = useAssignmentMutation();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timeZone = useTimeZone();
  const groupNames = useGroupNames();

  // Чужое групповое задание: только просмотр. Пока id не загрузился
  // (currentUserId undefined), считаем задание своим — мигание кнопок меньшее
  // зло, чем заблокированные действия у владельца.
  const isOwner = !currentUserId || assignment.user_id === currentUserId;
  const isGroupTask = Boolean(assignment.group_id);
  const groupName = assignment.group_id ? (groupNames[assignment.group_id] ?? null) : null;

  const priorityColors = {
    low: "border-emerald-200/70 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    medium:
      "border-amber-200/70 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
    high: "border-rose-200/70 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
  };

  const statusColors = {
    pending: "border-blue-200/70 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
    completed:
      "border-emerald-200/70 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    overdue: "border-rose-200/70 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
  };

  // Перевод приоритетов для отображения на карточке
  const priorityLabels = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
  };

  // Перевод статусов
  const statusLabels = {
    pending: "В работе",
    completed: "Выполнено",
    overdue: "Просрочено",
  };

  const dueDate = parseDueDate(assignment.due_date);
  const isOverdue = isAssignmentOverdue(assignment);
  const attachmentUrls = assignmentAttachments(assignment);
  const AttachmentIcon = attachmentUrls.length > 0 ? KIND_ICONS[attachmentKind(attachmentUrls[0])] : null;

  const handleComplete = async () => {
    if (isPreview) {
      onPreviewStatusChange?.(assignment.id, "completed");
      return;
    }
    await runMutation(() => setAssignmentStatus(assignment.id, "completed"), "Не удалось отметить как выполненное");
  };

  const handleDelete = async () => {
    if (isPreview) {
      onPreviewDelete?.(assignment.id);
      setDeleteDialogOpen(false);
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // Оптимистично: карточка исчезает сразу, реальный delete летит следом.
      // При ошибке SWR откатывает список, а мы показываем сообщение.
      await mutate<Assignment[]>(
        ASSIGNMENTS_KEY,
        async (current) => {
          await deleteAssignment(assignment.id);
          return (current ?? []).filter((a) => a.id !== assignment.id);
        },
        {
          optimisticData: (current) => (current ?? []).filter((a) => a.id !== assignment.id),
          rollbackOnError: true,
          revalidate: true,
        },
      );
    } catch (error) {
      setDeleteError(
        error instanceof AssignmentWriteError ? error.message : "Не удалось удалить задание. Попробуйте еще раз.",
      );
      return;
    } finally {
      setIsDeleting(false);
    }

    setDeleteDialogOpen(false);
  };

  const handleDeleteDialogChange = (next: boolean) => {
    if (isDeleting) return;
    setDeleteDialogOpen(next);
    setDeleteError(null);
  };

  // После закрытия диалогов фокус возвращаем на карточку — иначе он теряется в body.
  const restoreFocusToCard = (event: Event) => {
    event.preventDefault();
    cardRef.current?.focus();
  };

  const handleReopen = async () => {
    if (isPreview) {
      onPreviewStatusChange?.(assignment.id, "pending");
      return;
    }
    await runMutation(() => setAssignmentStatus(assignment.id, "pending"), "Не удалось вернуть задание в работу");
  };

  // Клик по самой карточке раскрывает большое окно с деталями — удобно читать
  // длинные описания и смотреть вложения. Кнопки действий глушат всплытие.
  const openDetails = () => setDetailsOpen(true);

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // События из Radix Portal всплывают по React-деру к карточке, хотя в DOM
    // диалог находится вне неё. Игнорируем их, чтобы крестик не открывал окно заново.
    if (!event.currentTarget.contains(event.target as Node)) return;
    openDetails();
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetails();
    }
  };

  return (
    <Card
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={`Открыть задание ${assignment.title}`}
      className={`group cursor-pointer gap-5 overflow-hidden rounded-2xl py-5 shadow-none transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        assignment.status === "completed" ? "bg-muted/35" : ""
      }`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pb-0">
        <div className="min-w-0 flex-1 pr-2">
          <p
            title={assignment.subject}
            className="mb-2 truncate text-xs font-bold uppercase tracking-[0.08em] text-primary"
          >
            {assignment.subject}
          </p>
          <CardTitle
            title={assignment.title}
            className={`line-clamp-2 text-lg font-extrabold leading-snug tracking-[-0.025em] [overflow-wrap:anywhere] ${
              assignment.status === "completed" ? "line-through decoration-muted-foreground/60" : ""
            }`}
          >
            {assignment.title}
          </CardTitle>
        </div>
        {isOwner && (
          <div className="-mr-2 -mt-2 flex shrink-0 items-center gap-1">
            {!isPreview && (
              <Button
                variant="ghost"
                size="icon"
                className="size-11 sm:size-9"
                title="Редактировать"
                onClick={(event) => {
                  event.stopPropagation();
                  setEditDialogOpen(true);
                }}
              >
                <Pencil aria-hidden="true" className="size-4" />
                <span className="sr-only">Редактировать {assignment.title}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-11 text-destructive hover:text-destructive sm:size-9"
              title="Удалить"
              onClick={(event) => {
                event.stopPropagation();
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              <span className="sr-only">Удалить {assignment.title}</span>
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-5">
        {assignment.description && (
          <p
            title={assignment.description}
            className="mb-4 line-clamp-2 min-h-10 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]"
          >
            {assignment.description}
          </p>
        )}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {isGroupTask && (
            <Badge
              variant="secondary"
              className="gap-1 rounded-full border border-violet-200/70 bg-violet-50 px-2.5 text-[11px] text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300"
              title={isOwner ? "Задание для этой группы" : "Задание от этой группы"}
            >
              <Users aria-hidden="true" className="size-3" />
              {groupName ?? "Группа"}
            </Badge>
          )}
          {AttachmentIcon && (
            <Badge
              variant="secondary"
              className="gap-1 rounded-full border border-border/70 bg-muted/60 px-2.5 text-[11px]"
              title="Есть вложения — откройте задание, чтобы посмотреть"
            >
              <AttachmentIcon aria-hidden="true" className="size-3" />
              {attachmentsCountLabel(attachmentUrls.length)}
            </Badge>
          )}
          <Badge
            variant="secondary"
            className={`rounded-full border px-2.5 text-[11px] ${priorityColors[assignment.priority]}`}
          >
            {priorityLabels[assignment.priority]}
          </Badge>
          <Badge
            variant="secondary"
            className={`rounded-full border px-2.5 text-[11px] ${
              isOverdue ? statusColors.overdue : statusColors[assignment.status]
            }`}
          >
            {isOverdue ? statusLabels.overdue : statusLabels[assignment.status]}
          </Badge>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-4">
          <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
            <Calendar aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{dueDateLabel(dueDate, timeZone)}</span>
          </div>
          {isOwner && (
            <Button
              variant={assignment.status === "completed" ? "outline" : "ghost"}
              size="sm"
              className="h-11 shrink-0 px-3 text-xs sm:h-9"
              onClick={(event) => {
                event.stopPropagation();
                if (assignment.status === "completed") {
                  handleReopen();
                } else {
                  handleComplete();
                }
              }}
            >
              {assignment.status === "completed" ? (
                <Clock aria-hidden="true" className="size-3.5" />
              ) : (
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
              )}
              {assignment.status === "completed" ? "Вернуть" : "Выполнить"}
            </Button>
          )}
        </div>
      </CardContent>

      {/* Обычный Dialog, а не AlertDialog: подтверждение закрывается и кликом
          по затемнению, и крестиком — застрять в нём нельзя. */}
      <Dialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
        <DialogContent className="sm:max-w-[425px]" onCloseAutoFocus={restoreFocusToCard}>
          <DialogHeader>
            <DialogTitle>Удалить это задание?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{assignment.title}</span> будет удалено безвозвратно. Это
              действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" disabled={isDeleting} onClick={() => handleDeleteDialogChange(false)}>
              Отмена
            </Button>
            <Button variant="destructive" disabled={isDeleting} aria-busy={isDeleting} onClick={handleDelete}>
              {isDeleting && <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {detailsOpen && (
        <Suspense fallback={null}>
          <AssignmentDetailsDialog
            assignment={assignment}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            isOwner={isOwner}
            isPreview={isPreview}
          />
        </Suspense>
      )}

      {!isPreview && editDialogOpen && (
        <Suspense fallback={null}>
          <EditAssignmentDialog
            assignment={assignment}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onCloseAutoFocus={restoreFocusToCard}
          />
        </Suspense>
      )}
    </Card>
  );
}
