"use client";

import { CalendarRange, ChevronDown, Loader2, Pencil, Plus, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ScheduleEditor } from "@/components/schedule/schedule-editor";
import { ScheduleWeek } from "@/components/schedule/schedule-week";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchScheduleEntries, type ScheduleEntry, type ScheduleScope } from "@/lib/data/schedule";
import { apiRequest } from "@/lib/api/client";

interface Membership {
  group_id: string;
  role: string;
  groups: { id: string; name: string } | null;
}

interface EditingState {
  scope: ScheduleScope;
  name: string;
}

export default function SchedulePage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Membership[]>([]);
  const [personalEntries, setPersonalEntries] = useState<ScheduleEntry[]>([]);
  const [groupEntries, setGroupEntries] = useState<Record<string, ScheduleEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Свернуто по умолчанию — раскрываем по клику на заголовок карточки.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<EditingState | null>(null);

  const toggle = (key: string) => setExpanded((current) => ({ ...current, [key]: !current[key] }));

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const directory = await apiRequest<{ userId: string; memberships: Membership[] }>("/api/groups");
      setUserId(directory.userId);
      setGroups(directory.memberships);
      const personal = await fetchScheduleEntries({ userId: directory.userId });
      setPersonalEntries(personal);
      const perGroup = await Promise.all(directory.memberships.map(async (m) => [m.group_id, await fetchScheduleEntries({ groupId: m.group_id })] as const));
      setGroupEntries(Object.fromEntries(perGroup));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить расписание.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasPersonal = personalEntries.length > 0;

  return (
    <div className="container max-w-4xl py-8 px-4 mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <CalendarRange aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Расписание</h1>
          <p className="text-sm text-muted-foreground">Расписания ваших групп и личное</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Расписания групп — свёрнутые карточки */}
      {groups.length > 0 && (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Расписания групп</p>
      )}
      <div className="grid gap-4">
        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Вы не состоите ни в одной группе — групповых расписаний пока нет.
          </p>
        )}
        {groups.map((member) => {
          const entries = groupEntries[member.group_id] ?? [];
          const isOwner = member.role === "starosta";
          const open = Boolean(expanded[member.group_id]);
          return (
            <Card key={member.group_id}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <button
                  type="button"
                  onClick={() => toggle(member.group_id)}
                  aria-expanded={open}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`}
                  />
                  <CardTitle className="text-base truncate">{member.groups?.name}</CardTitle>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {entries.length > 0 ? `записей: ${entries.length}` : "пусто"}
                  </span>
                </button>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setEditing({ scope: { groupId: member.group_id }, name: member.groups?.name ?? "" })}
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Редактировать</span>
                    <span className="sr-only sm:hidden">Редактировать расписание</span>
                  </Button>
                )}
              </CardHeader>
              {open && (
                <CardContent>
                  <ScheduleWeek entries={entries} />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Личное расписание — отделено от групповых и подсвечено:
          его видит только сам пользователь */}
      <div className="mt-10 grid gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">Личное</p>
        {hasPersonal ? (
          <Card className="border-primary/40 bg-primary/[0.04]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <button
                type="button"
                onClick={() => toggle("personal")}
                aria-expanded={Boolean(expanded.personal)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded.personal ? "" : "-rotate-90"}`}
                />
                <CardTitle className="text-base flex items-center gap-2">
                  <Star aria-hidden="true" className="h-4 w-4 text-primary" />
                  Личное расписание
                </CardTitle>
                <span className="shrink-0 text-xs text-muted-foreground">записей: {personalEntries.length}</span>
              </button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => userId && setEditing({ scope: { userId }, name: "Личное расписание" })}
              >
                <Pencil aria-hidden="true" className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Редактировать</span>
                <span className="sr-only sm:hidden">Редактировать личное расписание</span>
              </Button>
            </CardHeader>
            {expanded.personal && (
              <CardContent>
                <ScheduleWeek entries={personalEntries} />
              </CardContent>
            )}
          </Card>
        ) : (
          <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/[0.03] p-5">
            <Button onClick={() => userId && setEditing({ scope: { userId }, name: "Личное расписание" })}>
              <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
              Создать личное расписание
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">Личное расписание видите только вы.</p>
          </div>
        )}
      </div>

      <Link href="/dashboard" className="text-sm text-primary mt-6 block hover:underline">
        ← Вернуться к заданиям
      </Link>

      {editing && (
        <ScheduleEditor
          scope={editing.scope}
          name={editing.name}
          entries={"groupId" in editing.scope ? (groupEntries[editing.scope.groupId] ?? []) : personalEntries}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          onChanged={fetchData}
        />
      )}
    </div>
  );
}
