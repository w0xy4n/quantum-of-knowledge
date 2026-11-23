"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { AssignmentCard } from "@/components/assignment-card";
import { useTimeZone } from "@/components/timezone-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  addCalendarDays,
  formatDayKey,
  parseDueDate,
  shiftMonthStartKey,
  startOfWeekKey,
  zonedDayKey,
} from "@/lib/dates";
import type { Assignment } from "@/lib/types";

interface WeeklyViewProps {
  assignments: Assignment[];
  /** Чтобы карточки дня знали, чужое это групповое задание или своё. */
  currentUserId?: string;
}

type ViewMode = "week" | "month";

const priorityColors = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-rose-500",
} as const;

const priorityLabels: Record<string, string> = {
  low: "низкий",
  medium: "средний",
  high: "высокий",
};

const WEEKDAY_HEADERS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

const MS_PER_DAY = 86_400_000;

export function WeeklyView({ assignments, currentUserId }: WeeklyViewProps) {
  const [view, setView] = useState<ViewMode>("week");
  /** Сдвиг в неделях или месяцах — в зависимости от режима. */
  const [offset, setOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const timeZone = useTimeZone();

  const todayKey = zonedDayKey(new Date(), timeZone);

  // --- Режим недели ---
  const weekStartKey = addCalendarDays(startOfWeekKey(todayKey), offset * 7);
  const weekEndKey = addCalendarDays(weekStartKey, 6);
  const weekDayKeys = Array.from({ length: 7 }, (_, i) => addCalendarDays(weekStartKey, i));

  // --- Режим месяца: сетка от понедельника первой недели до воскресенья последней ---
  const monthStartKey = shiftMonthStartKey(todayKey, offset);
  const monthEndKey = addCalendarDays(shiftMonthStartKey(todayKey, offset + 1), -1);
  const monthGridStartKey = startOfWeekKey(monthStartKey);
  const monthGridEndKey = addCalendarDays(startOfWeekKey(monthEndKey), 6);
  const monthDayCount = Math.round((Date.parse(monthGridEndKey) - Date.parse(monthGridStartKey)) / MS_PER_DAY) + 1;
  const monthDayKeys = Array.from({ length: monthDayCount }, (_, i) => addCalendarDays(monthGridStartKey, i));

  const getAssignmentsForDay = (dayKey: string) => {
    return assignments.filter(
      (a) => a.status !== "completed" && zonedDayKey(parseDueDate(a.due_date), timeZone) === dayKey,
    );
  };

  const getRangeLabel = () => {
    if (view === "month") {
      return formatDayKey(monthStartKey, { month: "long", year: "numeric" }).replace(/^./, (c) => c.toUpperCase());
    }
    if (offset === 0) return "Текущая неделя";
    if (offset === 1) return "Следующая неделя";
    if (offset === -1) return "Прошлая неделя";
    const dayAndMonth: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${formatDayKey(weekStartKey, dayAndMonth)} — ${formatDayKey(weekEndKey, dayAndMonth)}`;
  };

  const prevLabel = view === "week" ? "Предыдущая неделя" : "Предыдущий месяц";
  const nextLabel = view === "week" ? "Следующая неделя" : "Следующий месяц";

  const selectedDayAssignments = selectedDay ? getAssignmentsForDay(selectedDay) : [];

  return (
    <Card className="gap-0 overflow-hidden rounded-3xl shadow-none">
      <CardHeader className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays aria-hidden="true" className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base font-extrabold tracking-[-0.02em] sm:text-lg">
              {view === "week" ? "Недельный план" : "План на месяц"}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{getRangeLabel()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div
            role="tablist"
            aria-label="Режим календаря"
            className="flex items-center rounded-full border bg-background/60 p-0.5"
          >
            {(["week", "month"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={view === mode}
                onClick={() => {
                  setView(mode);
                  setOffset(0);
                }}
                className={`h-8 rounded-full px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  view === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "week" ? "Неделя" : "Месяц"}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="size-11 sm:size-10" onClick={() => setOffset(offset - 1)}>
            <ChevronLeft aria-hidden="true" className="size-4" />
            <span className="sr-only">{prevLabel}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-11 px-3 text-xs sm:h-10"
            onClick={() => setOffset(0)}
            disabled={offset === 0}
          >
            Сегодня
          </Button>
          <Button variant="ghost" size="icon" className="size-11 sm:size-10" onClick={() => setOffset(offset + 1)}>
            <ChevronRight aria-hidden="true" className="size-4" />
            <span className="sr-only">{nextLabel}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4 sm:px-6 sm:py-5">
        {view === "month" ? (
          <div>
            <div className="mb-1.5 grid grid-cols-7 gap-1 sm:gap-1.5">
              {WEEKDAY_HEADERS.map((day, index) => (
                <p
                  key={day}
                  aria-hidden="true"
                  className={`text-center text-[10px] font-semibold sm:text-xs ${
                    index > 4 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {day}
                </p>
              ))}
            </div>
            <ul
              aria-label={`Задания к сдаче, ${getRangeLabel().toLowerCase()}`}
              className="grid grid-cols-7 gap-1 sm:gap-1.5"
            >
              {monthDayKeys.map((dayKey) => {
                const dayAssignments = getAssignmentsForDay(dayKey);
                const today = dayKey === todayKey;
                const inMonth = dayKey >= monthStartKey && dayKey <= monthEndKey;
                const fullDate = formatDayKey(dayKey, { weekday: "long", day: "numeric", month: "long" });

                return (
                  <li key={dayKey} aria-current={today ? "date" : undefined}>
                    <button
                      type="button"
                      onClick={() => setSelectedDay(dayKey)}
                      aria-label={`План на ${fullDate}${today ? " (сегодня)" : ""}: заданий ${dayAssignments.length}`}
                      className={`flex min-h-[52px] w-full cursor-pointer flex-col rounded-xl border p-1.5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[92px] sm:p-2 ${
                        today
                          ? "border-primary/60 bg-primary/[0.06]"
                          : inMonth
                            ? "bg-background/45 hover:border-primary/25"
                            : "border-transparent bg-muted/30 hover:border-primary/15"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span
                          aria-hidden="true"
                          className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums ${
                            today ? "bg-primary text-primary-foreground" : inMonth ? "" : "text-muted-foreground/60"
                          }`}
                        >
                          {formatDayKey(dayKey, { day: "numeric" })}
                        </span>
                        {dayAssignments.length > 0 && (
                          <span
                            aria-hidden="true"
                            className="text-[10px] font-semibold text-muted-foreground sm:hidden"
                          >
                            {dayAssignments.length}
                          </span>
                        )}
                      </span>
                      {/* Мобильный вид: точки приоритетов */}
                      <span aria-hidden="true" className="mt-auto flex flex-wrap items-center gap-1 pt-1.5 sm:hidden">
                        {dayAssignments.slice(0, 3).map((assignment) => (
                          <span
                            key={assignment.id}
                            className={`size-1.5 rounded-full ${priorityColors[assignment.priority]}`}
                          />
                        ))}
                        {dayAssignments.length > 3 && (
                          <span className="text-[9px] font-semibold leading-none text-muted-foreground">
                            +{dayAssignments.length - 3}
                          </span>
                        )}
                      </span>
                      {/* Десктопный вид: компактные чипы */}
                      <span className="mt-1.5 hidden flex-1 flex-col gap-1 sm:flex">
                        {dayAssignments.slice(0, 2).map((assignment) => (
                          <span
                            key={assignment.id}
                            className="flex items-center gap-1 rounded-md bg-muted/70 px-1.5 py-0.5"
                          >
                            <span
                              aria-hidden="true"
                              className={`size-1.5 shrink-0 rounded-full ${priorityColors[assignment.priority]}`}
                            />
                            <span className="sr-only">приоритет — {priorityLabels[assignment.priority]}: </span>
                            <span title={assignment.title} className="flex-1 truncate text-[10px] font-medium">
                              {assignment.title}
                            </span>
                          </span>
                        ))}
                        {dayAssignments.length > 2 && (
                          <span aria-hidden="true" className="px-0.5 text-[10px] font-semibold text-muted-foreground">
                            +{dayAssignments.length - 2} ещё
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <ul
            aria-label={`Задания к сдаче, ${getRangeLabel().toLowerCase()}`}
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-7"
          >
            {weekDayKeys.map((dayKey, dayIndex) => {
              const dayAssignments = getAssignmentsForDay(dayKey);
              const today = dayKey === todayKey;
              const fullDate = formatDayKey(dayKey, { weekday: "long", day: "numeric", month: "long" });

              return (
                <li
                  key={dayKey}
                  aria-current={today ? "date" : undefined}
                  className={dayIndex === 6 ? "col-span-2 sm:col-span-1" : ""}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDay(dayKey)}
                    aria-label={`План на ${fullDate}${today ? " (сегодня)" : ""}: заданий ${dayAssignments.length}`}
                    className={`flex min-h-[96px] w-full cursor-pointer flex-col rounded-2xl border p-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      today ? "border-primary/60 bg-primary/[0.06]" : "bg-background/45 hover:border-primary/25"
                    }`}
                  >
                    <div className="mb-2.5 flex items-baseline justify-between gap-2">
                      <p
                        aria-hidden="true"
                        className={`text-xs font-semibold ${dayIndex > 4 ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {formatDayKey(dayKey, { weekday: "short" }).replace(/^./, (c) => c.toUpperCase())}
                      </p>
                      <p
                        aria-hidden="true"
                        className={`grid size-7 place-items-center rounded-full text-sm font-extrabold tabular-nums ${
                          today ? "bg-primary text-primary-foreground" : ""
                        }`}
                      >
                        {formatDayKey(dayKey, { day: "numeric" })}
                      </p>
                    </div>
                    <span className="flex flex-1 flex-col gap-1.5">
                      {dayAssignments.slice(0, 2).map((assignment) => (
                        <span
                          key={assignment.id}
                          className="flex items-center gap-1.5 rounded-lg bg-muted/70 px-2 py-1.5"
                        >
                          <span
                            aria-hidden="true"
                            className={`size-1.5 shrink-0 rounded-full ${priorityColors[assignment.priority]}`}
                          />
                          <span className="sr-only">приоритет — {priorityLabels[assignment.priority]}: </span>
                          <span title={assignment.title} className="flex-1 truncate text-[11px] font-medium">
                            {assignment.title}
                          </span>
                        </span>
                      ))}
                      {dayAssignments.length > 2 && (
                        <Badge variant="secondary" className="w-fit rounded-full px-2 py-0 text-[11px]">
                          <span aria-hidden="true">+{dayAssignments.length - 2}</span>
                          <span className="sr-only">{dayAssignments.length - 2} еще в этот день</span>
                        </Badge>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {/* План на день: все задания с полной информацией и действиями */}
      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDay
                ? formatDayKey(selectedDay, { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) =>
                    c.toUpperCase(),
                  )
                : ""}
            </DialogTitle>
            <DialogDescription>
              {selectedDayAssignments.length > 0
                ? `Заданий на этот день: ${selectedDayAssignments.length}`
                : "На этот день заданий нет"}
            </DialogDescription>
          </DialogHeader>
          {selectedDayAssignments.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {selectedDayAssignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} currentUserId={currentUserId} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
