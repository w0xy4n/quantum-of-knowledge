"use client";

import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AssignmentCard } from "@/components/assignment-card";
import { StatsCards } from "@/components/stats-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isAssignmentOverdue, isAssignmentPending } from "@/lib/dates";
import type { Assignment, Status } from "@/lib/types";

const TABS = ["pending", "overdue", "completed", "all"] as const;
export type TabValue = (typeof TABS)[number];

export interface PreviewHandlers {
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
}

interface AssignmentsBoardProps {
  assignments: Assignment[];
  action: ReactNode;
  banner?: ReactNode;
  weeklyView: ReactNode;
  tab: TabValue;
  onTabChange: (tab: TabValue) => void;
  /** Кто смотрит доску — карточки чужих групповых заданий показываются без
   *  кнопок редактирования. */
  currentUserId?: string;
  preview?: PreviewHandlers;
}

export function AssignmentsBoard({
  assignments,
  action,
  banner,
  weeklyView,
  tab,
  onTabChange,
  currentUserId,
  preview,
}: AssignmentsBoardProps) {
  // Мемоизировано: фильтры не пересчитываются на каждый ререндер вкладок,
  // а только когда реально меняется список заданий.
  const groups: Record<TabValue, { rows: Assignment[]; empty: string }> = useMemo(() => {
    const pending = assignments.filter((a) => isAssignmentPending(a));
    const completed = assignments.filter((a) => a.status === "completed");
    const overdue = assignments.filter((a) => isAssignmentOverdue(a));
    return {
      pending: { rows: pending, empty: "Нет активных заданий" },
      overdue: { rows: overdue, empty: "Нет просроченных заданий — отличная работа!" },
      completed: { rows: completed, empty: "Пока нет выполненных заданий" },
      all: { rows: assignments, empty: "Пока нет заданий" },
    };
  }, [assignments]);

  const labels: Record<TabValue, string> = {
    pending: "В работе",
    overdue: "Просрочено",
    completed: "Выполнено",
    all: "Все",
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <section className="relative isolate overflow-hidden rounded-3xl border border-primary/15 bg-card px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 -z-10 size-48 rounded-full border-[32px] border-primary/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 right-28 -z-10 size-28 rounded-full bg-primary/5"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Личное пространство</p>
            <h1 className="text-2xl font-extrabold tracking-[-0.045em] sm:text-3xl">Мои задания</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Все дедлайны и приоритеты на одном экране.
            </p>
          </div>
          <div className="shrink-0">{action}</div>
        </div>
      </section>

      {banner}

      <StatsCards assignments={assignments} />

      {weeklyView}

      <Tabs value={tab} onValueChange={(value) => onTabChange(value as TabValue)} className="w-full gap-0 pt-1">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">Список заданий</h2>
            <p className="mt-1 text-sm text-muted-foreground">Выберите статус, чтобы сосредоточиться на нужном</p>
          </div>
          <span className="hidden text-sm font-semibold tabular-nums text-muted-foreground sm:block">
            {groups[tab].rows.length} из {assignments.length}
          </span>
        </div>
        <TabsList
          aria-label="Фильтр заданий по статусу"
          className="h-auto min-h-12 w-full justify-start gap-1 overflow-x-auto rounded-2xl p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((value) => (
            <TabsTrigger
              key={value}
              value={value}
              className="min-h-11 rounded-xl px-3 text-xs sm:min-h-10 sm:px-4 sm:text-sm"
            >
              {labels[value]}
              <span className="font-semibold tabular-nums opacity-70">{groups[value].rows.length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((value) => (
          <TabsContent key={value} value={value} className="mt-5">
            <AssignmentsGrid
              assignments={groups[value].rows}
              emptyMessage={groups[value].empty}
              currentUserId={currentUserId}
              preview={preview}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function AssignmentsGrid({
  assignments,
  emptyMessage,
  currentUserId,
  preview,
}: {
  assignments: Assignment[];
  emptyMessage: string;
  currentUserId?: string;
  preview?: PreviewHandlers;
}) {
  if (assignments.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed bg-card/60 px-6 py-12 text-center">
        <Inbox aria-hidden="true" className="mb-4 size-8 text-muted-foreground" strokeWidth={1.5} />
        <p className="font-semibold">{emptyMessage}</p>
        <p className="mt-1 text-sm text-muted-foreground">Здесь появятся задания выбранной категории</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          currentUserId={currentUserId}
          isPreview={Boolean(preview)}
          onPreviewStatusChange={preview?.onStatusChange}
          onPreviewDelete={preview?.onDelete}
        />
      ))}
    </div>
  );
}

export function useTabState(initial: string | null): [TabValue, (tab: TabValue) => void] {
  const [tab, setTab] = useState<TabValue>(() => asTabValue(initial));

  const change = (next: TabValue) => {
    setTab(next);
    const params = new URLSearchParams(window.location.search);
    if (next === "pending") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

  return [tab, change];
}

function asTabValue(value: string | null): TabValue {
  return (TABS as readonly string[]).includes(value ?? "") ? (value as TabValue) : "pending";
}
