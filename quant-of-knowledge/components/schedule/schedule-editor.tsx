"use client";

import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { timeLabel, WEEK_DAYS } from "@/components/schedule/schedule-week";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addScheduleEntry,
  deleteScheduleEntry,
  findScheduleConflict,
  SCHEDULE_COLORS,
  type ScheduleEntry,
  type ScheduleScope,
  scheduleColorSwatch,
  updateScheduleEntry,
} from "@/lib/data/schedule";

interface ScheduleEditorProps {
  scope: ScheduleScope;
  /** Название для заголовка: имя группы или «Личное расписание». */
  name: string;
  entries: ScheduleEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** После каждой правки — страница перечитывает данные. */
  onChanged: () => void;
}

/** Редактор расписания: владелец группы правит групповое, пользователь — своё. */
export function ScheduleEditor({ scope, name, entries, open, onOpenChange, onChanged }: ScheduleEditorProps) {
  const [day, setDay] = useState(1);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [color, setColor] = useState<string>("default");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayEntries = entries.filter((e) => e.day_of_week === day);

  const resetForm = () => {
    setTitle("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setNote("");
    setColor("default");
    setEditingId(null);
  };

  const startEdit = (entry: ScheduleEntry) => {
    setDay(entry.day_of_week);
    setTitle(entry.title);
    setStartTime(entry.start_time.slice(0, 5));
    setEndTime(entry.end_time ? entry.end_time.slice(0, 5) : "");
    setLocation(entry.location ?? "");
    setNote(entry.note ?? "");
    setColor(entry.color ?? "default");
    setEditingId(entry.id);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !startTime) {
      setError("Заполните название и время начала.");
      return;
    }
    if (endTime && endTime < startTime) {
      setError("Время конца раньше времени начала.");
      return;
    }

    // На одно время — одно событие: пересечений в расписании быть не должно.
    const conflict = findScheduleConflict(entries, day, startTime, endTime || null, editingId ?? undefined);
    if (conflict) {
      setError(
        `Время занято: «${conflict.title}» (${timeLabel(conflict.start_time)}${conflict.end_time ? `–${timeLabel(conflict.end_time)}` : ""}).`,
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const draft = {
        title,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime || null,
        location,
        note,
        color,
      };
      if (editingId) {
        await updateScheduleEntry(editingId, draft);
      } else {
        await addScheduleEntry(scope, draft);
      }
      resetForm();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить запись.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await deleteScheduleEntry(id);
      if (editingId === id) resetForm();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить запись.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Редактировать расписание — {name}</DialogTitle>
          <DialogDescription>Добавляйте пары и события по дням недели.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1">
          {WEEK_DAYS.map((d) => (
            <Button
              key={d.n}
              type="button"
              variant={day === d.n ? "default" : "outline"}
              size="sm"
              onClick={() => setDay(d.n)}
            >
              {d.short}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {dayEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">На {WEEK_DAYS[day - 1].long.toLowerCase()} ничего нет.</p>
          ) : (
            dayEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {scheduleColorSwatch(entry.color) && (
                      <span
                        aria-hidden="true"
                        className={`size-2 shrink-0 rounded-full ${scheduleColorSwatch(entry.color)}`}
                      />
                    )}
                    <span className="truncate">{entry.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeLabel(entry.start_time)}
                    {entry.end_time ? `–${timeLabel(entry.end_time)}` : ""}
                    {entry.location ? ` · ${entry.location}` : ""}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={busy}
                    title="Редактировать запись"
                    onClick={() => startEdit(entry)}
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                    <span className="sr-only">Редактировать {entry.title}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    disabled={busy}
                    title="Удалить запись"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    <span className="sr-only">Удалить {entry.title}</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="grid gap-3 rounded-md border p-3">
          <div className="grid gap-2">
            <Label htmlFor="schedule-title">Название</Label>
            <Input
              id="schedule-title"
              placeholder="Например, Матанализ, 2 пара"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="schedule-start">Начало</Label>
              <Input id="schedule-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schedule-end">Конец (необязательно)</Label>
              <Input id="schedule-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="schedule-location">Место (необязательно)</Label>
            <Input
              id="schedule-location"
              placeholder="Аудитория 204"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="schedule-note">Заметка (необязательно)</Label>
            <Input
              id="schedule-note"
              placeholder="Принести лабораторную"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
          </div>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium leading-none">Цвет</legend>
            <div className="flex flex-wrap gap-2">
              {SCHEDULE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  aria-label={`Цвет: ${c.label}`}
                  aria-pressed={color === c.value}
                  onClick={() => setColor(c.value)}
                  className={`grid size-7 place-items-center rounded-full transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    color === c.value ? "ring-2 ring-foreground/70 ring-offset-2 ring-offset-background" : ""
                  }`}
                >
                  <span aria-hidden="true" className={`size-5 rounded-full ${c.swatch}`} />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={busy || !title.trim() || !startTime}>
              {busy ? (
                <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
              )}
              {editingId ? "Сохранить изменения" : "Добавить запись"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm} disabled={busy}>
                <X aria-hidden="true" className="mr-2 h-4 w-4" />
                Отмена
              </Button>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
