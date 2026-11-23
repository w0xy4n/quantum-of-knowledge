"use client";

import { AssignmentForm, type AssignmentFormPayload, assignmentToForm } from "@/components/assignments/assignment-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAssignmentMutation } from "@/hooks/use-assignment-mutation";
import { useClasses, useSubjectOptions } from "@/hooks/use-classes";
import { assignmentAttachments } from "@/lib/attachments";
import { updateAssignment } from "@/lib/data/assignments";
import { resolveClassId } from "@/lib/data/classes";
import { proClientSection } from "@/lib/pro/client";
import { uploadAssignmentImage } from "@/lib/storage";
import type { Assignment } from "@/lib/types";

interface EditAssignmentDialogProps {
  assignment: Assignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Where focus should go when this closes. The caller opens it from a dropdown
   * item that is unmounted by the time the dialog closes, so Radix's own restore
   * has nothing to aim at and focus falls to `<body>`.
   */
  onCloseAutoFocus?: (event: Event) => void;
}

/**
 * Undefined in every build without the optional module, in which case nothing is
 * drawn here — not an empty section, not a prompt. Resolved once at module scope
 * rather than per render, because which build this is cannot change while the
 * page is open.
 */
const Attachments = proClientSection("assignmentAttachments");

export function EditAssignmentDialog({ assignment, open, onOpenChange, onCloseAutoFocus }: EditAssignmentDialogProps) {
  const subjectOptions = useSubjectOptions();
  const { data: classes } = useClasses();
  const { runMutation, isPending } = useAssignmentMutation();

  const handleSubmit = async (payload: AssignmentFormPayload) => {
    // Новые файлы догружаем в хранилище и склеиваем с теми, что оставили.
    const { files, keepUrls, ...fields } = payload;
    // See the note in `add-assignment-dialog.tsx`: the form knows subject names,
    // this knows which of them are saved classes.
    const linked = { ...fields, class_id: resolveClassId(fields.subject, classes) };
    const saved = await runMutation(async () => {
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push(await uploadAssignmentImage(file));
      }
      const attachment_urls = [...keepUrls, ...uploaded];
      // Пишем колонку, только когда есть что писать или было что чистить:
      // задание без файлов не должно зависеть от миграции схемы.
      const attachmentsPatch =
        attachment_urls.length > 0 || assignmentAttachments(assignment).length > 0
          ? { attachment_urls, image_url: attachment_urls[0] ?? null }
          : {};
      await updateAssignment(assignment.id, { ...linked, ...attachmentsPatch });
    }, "Не удалось сохранить изменения");

    // Stay open on failure: the edits are only in this form, and closing would
    // discard them while the list quietly revalidated back to the old row.
    if (saved) onOpenChange(false);
    return saved;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>Редактировать задание</DialogTitle>
          <DialogDescription>Измените детали задания ниже.</DialogDescription>
        </DialogHeader>
        {/* The form lives inside DialogContent, which Radix unmounts on close, so
            it re-seeds from the assignment on every open. That is what the effect
            watching [open, assignment] used to do by hand. */}
        <AssignmentForm
          initialValues={assignmentToForm(assignment)}
          subjectOptions={subjectOptions}
          submitLabel="Сохранить"
          pendingLabel="Сохранение..."
          isPending={isPending}
          onSubmit={handleSubmit}
        />
        {/* After the form rather than inside it: attaching a file is its own
            action that saves immediately, and putting it among fields that only
            take effect on submit would make one of the two a lie. */}
        {Attachments ? (
          <div className="border-t pt-4">
            <Attachments assignmentId={assignment.id} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
