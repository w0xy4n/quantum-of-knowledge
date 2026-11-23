"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import {
  AssignmentForm,
  type AssignmentFormPayload,
  emptyAssignmentForm,
} from "@/components/assignments/assignment-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Assignment } from "@/lib/types";

/** Демо-предметы для страницы предпросмотра */
const PREVIEW_SUBJECTS = ["Математика", "История", "Физика", "Английский", "Химия", "Искусство"];

interface PreviewAddAssignmentDialogProps {
  onAdd: (assignment: Assignment) => void;
}

export function PreviewAddAssignmentDialog({ onAdd }: PreviewAddAssignmentDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (payload: AssignmentFormPayload) => {
    const stamp = new Date().toISOString();
    // В предпросмотре файлы никуда не загружаются — показываем только поля.
    const { files: _files, keepUrls: _keep, ...fields } = payload;

    onAdd({
      ...fields,
      id: `preview-${Date.now()}`,
      user_id: "preview-user",
      class_id: null,
      group_id: null,
      image_url: null,
      attachment_urls: [],
      status: "pending",
      created_at: stamp,
      updated_at: stamp,
      completed_at: null,
    });

    setOpen(false);
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          <Plus className="size-4" />
          Добавить задание
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Новое задание</DialogTitle>
          <DialogDescription>Это предпросмотр — данные не сохраняются.</DialogDescription>
        </DialogHeader>
        <AssignmentForm
          initialValues={emptyAssignmentForm()}
          subjectOptions={PREVIEW_SUBJECTS}
          submitLabel="Добавить"
          pendingLabel="Добавление..."
          isPending={false}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
