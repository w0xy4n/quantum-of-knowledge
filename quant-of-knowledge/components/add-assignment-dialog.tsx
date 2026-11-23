"use client";

import { Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssignmentMutation } from "@/hooks/use-assignment-mutation";
import { useClasses, useSubjectOptions } from "@/hooks/use-classes";
import { type AssignmentDraft, createAssignment } from "@/lib/data/assignments";
import { resolveClassId } from "@/lib/data/classes";
import { apiRequest } from "@/lib/api/client";
import { uploadAssignmentImage } from "@/lib/storage";

interface OwnedGroup {
  id: string;
  name: string;
}

/** Значение селекта для личного задания (пустую строку Radix не принимает). */
const PERSONAL = "personal";

export function AddAssignmentDialog() {
  const subjectOptions = useSubjectOptions();
  const { data: classes } = useClasses();
  const { runMutation, isPending } = useAssignmentMutation();
  const [open, setOpen] = useState(false);

  const [ownedGroups, setOwnedGroups] = useState<OwnedGroup[]>([]);
  const [target, setTarget] = useState<string>(PERSONAL);

  useEffect(() => {
    if (!open) return;
    apiRequest<{ memberships: { role: string; groups: OwnedGroup | null }[] }>("/api/groups")
      .then((result) => setOwnedGroups(result.memberships.filter((row) => row.role === "starosta" && row.groups).map((row) => row.groups as OwnedGroup)))
      .catch(() => setOwnedGroups([]));
  }, [open]);

  const handleSubmit = async (payload: AssignmentFormPayload) => {
    // files — не колонка в базе: сначала загружаем файлы в хранилище,
    // а в задание пишем только ссылки. Отправлять сами файлы в insert нельзя —
    // PostgREST отклонит всю строку из-за неизвестной колонки.
    const { files, keepUrls, ...fields } = payload;

    // Выбранная владельцем группа получает задание; иначе — личное.
    const targetGroupId = target !== PERSONAL ? target : null;

    const linked: AssignmentDraft = {
      ...fields,
      group_id: targetGroupId,
      class_id: resolveClassId(fields.subject, classes),
    };

    // Загрузка внутри мутации: если файл не улетел, задание не создаётся,
    // а текст ошибки (AssignmentWriteError) уходит в тост как есть.
    const saved = await runMutation(async () => {
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push(await uploadAssignmentImage(file));
      }
      const attachment_urls = [...keepUrls, ...uploaded];
      // Первое вложение дублируем в image_url — старые читатели и экспорт
      // смотрят туда. Пустой массив не шлём: колонка появляется миграцией,
      // и задание без файлов должно сохраняться и до неё.
      await createAssignment(
        attachment_urls.length > 0
          ? { ...linked, attachment_urls, image_url: attachment_urls[0] }
          : { ...linked, image_url: null },
      );
    }, "Не удалось добавить задание");

    if (saved) {
      setOpen(false);
      setTarget(PERSONAL);
    }
    return saved;
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
          <DialogDescription>
            {ownedGroups.length > 0
              ? "Создайте задание для себя или отправьте его одной из ваших групп."
              : "Добавьте новое личное задание в свой трекер."}
          </DialogDescription>
        </DialogHeader>

        {/* Выбор адресата, виден ТОЛЬКО владельцам групп */}
        {ownedGroups.length > 0 && (
          <div className="grid gap-2 bg-muted p-3 rounded-md border">
            <Label htmlFor="target-group" className="flex items-center gap-1.5 text-sm font-medium">
              <Users aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              Кому задание
            </Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger id="target-group">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PERSONAL}>Личное задание (только мне)</SelectItem>
                {ownedGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    Группа «{group.name}» (увидят все участники)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <AssignmentForm
          initialValues={emptyAssignmentForm()}
          subjectOptions={subjectOptions}
          submitLabel="Добавить"
          pendingLabel="Добавление..."
          isPending={isPending}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
