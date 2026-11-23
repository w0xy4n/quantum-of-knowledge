"use client";

import { format, isBefore, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Infinity as InfinityIcon, X } from "lucide-react";
import type React from "react";
import { useId, useState } from "react";
import { ClassCombobox } from "@/components/class-combobox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { assignmentAttachments, attachmentExt } from "@/lib/attachments";
import type { Assignment, Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface AssignmentFormValues {
  title: string;
  subject: string;
  description: string;
  dueDate: Date | undefined;
  dueTime: string;
  /** Бессрочное задание: дедлайна нет, дату и время не спрашиваем. */
  noDeadline: boolean;
  priority: Priority;
  /** Новые файлы, которые ещё нужно загрузить в хранилище. */
  files: File[];
  /** Уже загруженные вложения, которые остаются (режим редактирования). */
  keepUrls: string[];
}

/** What the form hands to its parent on submit. `files` stays out of the
 *  database write — the caller uploads them and merges into `attachment_urls`. */
export interface AssignmentFormPayload {
  title: string;
  subject: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  /** Новые файлы для загрузки. */
  files: File[];
  /** Уже загруженные вложения, которые надо сохранить. */
  keepUrls: string[];
}

export function emptyAssignmentForm(): AssignmentFormValues {
  return {
    title: "",
    subject: "",
    description: "",
    dueDate: undefined,
    dueTime: "23:59",
    noDeadline: false,
    priority: "medium",
    files: [],
    keepUrls: [],
  };
}

/** Pre-fills the form for editing an existing assignment. */
export function assignmentToForm(assignment: Assignment): AssignmentFormValues {
  const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
  const valid = dueDate && !Number.isNaN(dueDate.getTime());
  return {
    title: assignment.title,
    subject: assignment.subject,
    description: assignment.description ?? "",
    dueDate: valid ? dueDate : undefined,
    dueTime: valid ? format(dueDate, "HH:mm") : "23:59",
    noDeadline: !valid,
    priority: assignment.priority,
    files: [],
    keepUrls: assignmentAttachments(assignment),
  };
}

interface AssignmentFormProps {
  initialValues: AssignmentFormValues;
  subjectOptions: string[];
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  onSubmit: (payload: AssignmentFormPayload) => unknown;
}

export function AssignmentForm({
  initialValues,
  subjectOptions,
  submitLabel,
  pendingLabel,
  isPending,
  onSubmit,
}: AssignmentFormProps) {
  const fieldId = useId();
  const id = (name: string) => `${fieldId}-${name}`;

  const [values, setValues] = useState<AssignmentFormValues>(initialValues);
  const [error, setError] = useState<string>("");
  const [dateOpen, setDateOpen] = useState(false);

  const set = <K extends keyof AssignmentFormValues>(key: K, value: AssignmentFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    set("files", [...values.files, ...Array.from(list)]);
  };

  const removeFile = (index: number) => {
    set(
      "files",
      values.files.filter((_, i) => i !== index),
    );
  };

  const removeKeptUrl = (url: string) => {
    set(
      "keepUrls",
      values.keepUrls.filter((u) => u !== url),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!values.title.trim()) {
      setError("Введите название задания.");
      return;
    }
    if (!values.subject.trim()) {
      setError("Выберите или введите предмет.");
      return;
    }
    if (!values.noDeadline && !values.dueDate) {
      setError("Выберите дату сдачи или отметьте «Без срока сдачи».");
      return;
    }

    let due_date: string | null = null;
    if (!values.noDeadline && values.dueDate) {
      const [hours, minutes] = values.dueTime.split(":");
      const due = new Date(values.dueDate);
      due.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10), 0, 0);
      due_date = due.toISOString();
    }

    // Отправляем в родительский компонент (AddAssignmentDialog)
    await onSubmit({
      title: values.title.trim(),
      subject: values.subject,
      description: values.description || null,
      due_date,
      priority: values.priority,
      files: values.files,
      keepUrls: values.keepUrls,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 py-4 min-w-0">
        <div className="grid gap-2">
          <Label htmlFor={id("title")}>Название</Label>
          <Input
            id={id("title")}
            placeholder="Домашняя работа"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={id("subject")}>Предмет</Label>
          <ClassCombobox
            id={id("subject")}
            value={values.subject}
            onValueChange={(value) => set("subject", value)}
            options={subjectOptions}
            invalid={!!error && error.includes("предмет")}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={id("description")}>Описание (необязательно)</Label>
          <Textarea
            id={id("description")}
            placeholder="Что нужно сделать..."
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={id("file")}>Прикрепить файлы — фото, видео, документы (необязательно)</Label>
          <Input
            id={id("file")}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
            className="cursor-pointer"
          />
          {(values.keepUrls.length > 0 || values.files.length > 0) && (
            <ul className="flex flex-col gap-1">
              {values.keepUrls.map((url) => (
                <li
                  key={url}
                  className="flex items-center justify-between gap-2 rounded-md border bg-muted/50 px-2 py-1 text-xs"
                >
                  <span className="truncate">Файл .{attachmentExt(url).toLowerCase()} — уже прикреплён</span>
                  <button
                    type="button"
                    onClick={() => removeKeptUrl(url)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    title="Убрать вложение"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
              {values.files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-xs"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    title="Убрать файл"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={id("no-deadline")}
            checked={values.noDeadline}
            onChange={(e) => set("noDeadline", e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-primary"
          />
          <Label htmlFor={id("no-deadline")} className="flex items-center gap-1.5 cursor-pointer font-normal">
            <InfinityIcon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            Без срока сдачи (бессрочное задание)
          </Label>
        </div>

        {!values.noDeadline && (
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor={id("due-date")}>Дата сдачи</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id={id("due-date")}
                    type="button"
                    variant="outline"
                    className={cn("justify-start text-left font-normal", !values.dueDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {values.dueDate ? format(values.dueDate, "PPP", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={ru}
                    selected={values.dueDate}
                    onSelect={(date) => {
                      set("dueDate", date);
                      if (date) setDateOpen(false);
                    }}
                    modifiers={{ past: (date) => isBefore(startOfDay(date), startOfDay(new Date())) }}
                    modifiersClassNames={{ past: "opacity-40" }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={id("due-time")}>Время сдачи</Label>
              <Input
                id={id("due-time")}
                type="time"
                value={values.dueTime}
                onChange={(e) => set("dueTime", e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor={id("priority")}>Приоритет</Label>
          <Select value={values.priority} onValueChange={(v) => set("priority", v as Priority)}>
            <SelectTrigger id={id("priority")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Низкий</SelectItem>
              <SelectItem value="medium">Средний</SelectItem>
              <SelectItem value="high">Высокий</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
