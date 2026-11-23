"use client";

import { GraduationCap, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { useSWRConfig } from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClasses, useUnsavedSubjects } from "@/hooks/use-classes";
import { apiRequest } from "@/lib/api/client";
import { ASSIGNMENTS_KEY, CLASSES_KEY } from "@/lib/swr-keys";
import type { Class } from "@/lib/types";

/**
 * Settings → Assignments → My Classes.
 *
 * The list a student saves so filing an assignment is a click rather than
 * retyping "Mathematics". Assignments still hold `subject` as free text and do
 * not reference these rows, so renaming or deleting a class leaves existing work
 * alone.
 */
export function ClassesManager({ userId }: { userId: string }) {
  const { mutate } = useSWRConfig();
  const { data: classes } = useClasses();
  const unsavedSubjects = useUnsavedSubjects();

  const nameFieldId = useId();

  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * The table has a unique index on (user_id, lower(name)), but catching the
   * clash here means a readable message instead of a raw Postgres error.
   */
  const findDuplicate = (candidate: string, ignoreId?: string) =>
    (classes ?? []).find((c) => c.id !== ignoreId && c.name.trim().toLowerCase() === candidate.trim().toLowerCase());

  const save = async (candidate: string, ignoreId?: string): Promise<boolean> => {
    const trimmed = candidate.trim();
    if (!trimmed) return false;
    if (findDuplicate(trimmed, ignoreId)) {
      setError(`У вас уже есть предмет «${trimmed}».`);
      return false;
    }
    setIsSaving(true);
    setError(null);
    try {
      await apiRequest(ignoreId ? `/api/classes/${ignoreId}` : "/api/classes", {
        method: ignoreId ? "PATCH" : "POST",
        body: JSON.stringify({ name: trimmed }),
      });
      mutate(CLASSES_KEY);
      if (ignoreId) mutate(ASSIGNMENTS_KEY);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось сохранить предмет.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = async () => {
    if (await save(name)) { setName(""); setIsAdding(false); }
  };
  const handleSaveEdit = async () => {
    if (editing && await save(name, editing.id)) handleCancel();
  };
  const handleEdit = (target: Class) => {
    setEditing(target); setName(target.name); setError(null); setIsAdding(false);
  };
  const handleCancel = () => {
    setEditing(null); setIsAdding(false); setName(""); setError(null);
  };
  const handleDelete = async (target: Class) => {
    try {
      const ownAssignments = await apiRequest<{ class_id: string | null }[]>("/api/assignments");
      const filed = ownAssignments.filter((assignment) => assignment.class_id === target.id).length;
      if (filed > 0 && !confirm(`По предмету «${target.name}» есть задания (${filed}). Они сохранятся. Удалить предмет?`)) return;
      await apiRequest(`/api/classes/${target.id}`, { method: "DELETE" });
      mutate(CLASSES_KEY);
      mutate(ASSIGNMENTS_KEY);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось удалить предмет.");
    }
  };

  const saved = classes ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap aria-hidden="true" className="h-5 w-5" />
          Мои предметы
        </CardTitle>
        <CardDescription>
          Сохраните свои предметы и выбирайте их при добавлении задания вместо того, чтобы каждый раз печатать название.
          Ввести можно и то, чего нет в списке.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {saved.length > 0 && (
          <ul className="space-y-2">
            {saved.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                <span title={c.name} className="font-medium truncate">
                  {c.name}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(c)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Изменить ${c.name}`}
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(c)}
                    className="text-destructive hover:text-destructive"
                    aria-label={`Удалить ${c.name}`}
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {isAdding || editing ? (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="grid gap-2">
              <Label htmlFor={nameFieldId}>{editing ? "Изменить название предмета" : "Название предмета"}</Label>
              <Input
                id={nameFieldId}
                placeholder="Математика"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                aria-invalid={Boolean(error) || undefined}
                maxLength={100}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={editing ? handleSaveEdit : handleAdd} disabled={!name.trim() || isSaving}>
                {isSaving && <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Сохранить" : "Сохранить предмет"}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => {
              setIsAdding(true);
              setError(null);
            }}
            variant="outline"
            className="w-full"
          >
            <Plus aria-hidden="true" className="h-4 w-4 mr-2" />
            Добавить предмет
          </Button>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Subjects already in use that aren't saved yet - one click to keep them. */}
        {unsavedSubjects.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Уже встречаются в ваших заданиях — нажмите, чтобы сохранить как предмет:
            </p>
            <div className="flex flex-wrap gap-2">
              {unsavedSubjects.map((subject) => (
                <Button key={subject} variant="secondary" size="sm" disabled={isSaving} onClick={() => save(subject)}>
                  <Plus aria-hidden="true" className="h-3 w-3 mr-1" />
                  {subject}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
