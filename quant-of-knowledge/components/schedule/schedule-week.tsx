"use client";

import { Clock, MapPin, StickyNote } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type ScheduleEntry, scheduleColorSwatch } from "@/lib/data/schedule";

export const WEEK_DAYS = [
  { n: 1, short: "Пн", long: "Понедельник" },
  { n: 2, short: "Вт", long: "Вторник" },
  { n: 3, short: "Ср", long: "Среда" },
  { n: 4, short: "Чт", long: "Четверг" },
  { n: 5, short: "Пт", long: "Пятница" },
  { n: 6, short: "Сб", long: "Суббота" },
  { n: 7, short: "Вс", long: "Воскресенье" },
] as const;

/** Фон и рамка плашки события по цветовой метке. */
const ENTRY_COLOR_STYLES: Record<string, string> = {
  default: "border-transparent bg-muted/70 hover:bg-muted",
  blue: "border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20",
  emerald: "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20",
  amber: "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20",
  rose: "border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20",
  violet: "border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20",
};

/** Postgres хранит time как "HH:MM:SS" — показываем "HH:MM". */
export function timeLabel(value: string | null): string {
  return value ? value.slice(0, 5) : "";
}

/** Недельная сетка расписания: 7 колонок, записи по времени.
 *  Клик по записи открывает окно с полной информацией. */
export function ScheduleWeek({ entries }: { entries: ScheduleEntry[] }) {
  const [selected, setSelected] = useState<ScheduleEntry | null>(null);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Расписание пустое.</p>;
  }

  const selectedDay = selected ? WEEK_DAYS.find((d) => d.n === selected.day_of_week) : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {WEEK_DAYS.map((day) => {
          const dayEntries = entries.filter((e) => e.day_of_week === day.n);
          return (
            <div key={day.n} className="flex flex-col gap-1.5 rounded-2xl border bg-background/45 p-2.5">
              <p className="px-1 text-xs font-semibold text-muted-foreground">{day.short}</p>
              {dayEntries.length === 0 ? (
                <p className="px-1 pb-1 text-[11px] text-muted-foreground/60">—</p>
              ) : (
                dayEntries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelected(entry)}
                    className={`rounded-lg border px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      ENTRY_COLOR_STYLES[entry.color ?? "default"] ?? ENTRY_COLOR_STYLES.default
                    }`}
                  >
                    <p className="truncate text-[11px] font-semibold">{entry.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock aria-hidden="true" className="size-2.5 shrink-0" />
                      {timeLabel(entry.start_time)}
                      {entry.end_time ? `–${timeLabel(entry.end_time)}` : ""}
                    </p>
                    {entry.location && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                        <MapPin aria-hidden="true" className="size-2.5 shrink-0" />
                        {entry.location}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          );
        })}
      </div>

      {/* Информация о событии */}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="[overflow-wrap:anywhere]">{selected?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-1.5">
              {selectedDay?.long}
              {selected && scheduleColorSwatch(selected.color) && (
                <span
                  aria-hidden="true"
                  className={`inline-block size-2.5 rounded-full ${scheduleColorSwatch(selected.color)}`}
                />
              )}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col gap-3 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock aria-hidden="true" className="h-4 w-4 shrink-0" />
                {timeLabel(selected.start_time)}
                {selected.end_time ? ` – ${timeLabel(selected.end_time)}` : " (время конца не указано)"}
              </p>
              {selected.location && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
                  {selected.location}
                </p>
              )}
              {selected.note && (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <StickyNote aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{selected.note}</span>
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
