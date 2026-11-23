import { AlertTriangle, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAssignmentOverdue, isAssignmentPending } from "@/lib/dates";
import type { Assignment } from "@/lib/types";

interface StatsCardsProps {
  assignments: Assignment[];
}

export function StatsCards({ assignments }: StatsCardsProps) {
  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === "completed").length;
  const pending = assignments.filter((a) => isAssignmentPending(a)).length;
  const overdue = assignments.filter((a) => isAssignmentOverdue(a)).length;

  const stats = [
    {
      title: "Всего",
      value: total,
      hint: "заданий в списке",
      icon: BookOpen,
      color: "text-primary",
    },
    {
      title: "В работе",
      value: pending,
      hint: "активных сейчас",
      icon: Clock,
      color: "text-sky-600 dark:text-sky-400",
    },
    {
      title: "Выполнено",
      value: completed,
      hint: "уже завершено",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Просрочено",
      value: overdue,
      hint: "требуют внимания",
      icon: AlertTriangle,
      color: "text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <section aria-label="Сводка по заданиям" className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="gap-0 rounded-2xl py-3 shadow-none transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-0">
            <CardTitle className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon aria-hidden="true" className={`size-4 ${stat.color}`} strokeWidth={2} />
          </CardHeader>
          <CardContent className="flex items-baseline gap-2 px-4 pt-1.5">
            <div className="text-2xl font-extrabold tabular-nums tracking-[-0.05em]">{stat.value}</div>
            <p className="truncate text-[11px] text-muted-foreground">{stat.hint}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
