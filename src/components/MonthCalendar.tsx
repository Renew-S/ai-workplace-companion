import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarTask = {
  id: string;
  title: string;
  priority: string;
  dueDate?: string;
  done?: boolean;
};

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function localDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MonthCalendar({ tasks }: { tasks?: CalendarTask[] }) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const list: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      list.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [cursor]);

  const dots = useMemo(() => {
    const map: Record<string, "high" | "medium" | "low"> = {};
    const rank: Record<string, number> = { high: 3, medium: 2, low: 1 };
    for (const task of tasks ?? []) {
      if (task.done || !task.dueDate) continue;
      const [y, m, d] = task.dueDate.split("-").map(Number);
      if (!y || !m || !d) continue;
      const dt = new Date(y, m - 1, d);
      if (dt.getMonth() !== cursor.getMonth() || dt.getFullYear() !== cursor.getFullYear()) continue;
      const key = localDateKey(dt);
      const p = task.priority?.toLowerCase();
      if (!p || !(p in rank)) continue;
      if ((rank[p] ?? 0) > (rank[map[key]] ?? 0)) map[key] = p as "high" | "medium" | "low";
    }
    return map;
  }, [tasks, cursor]);

  const dotClass: Record<string, string> = {
    high: "bg-[var(--priority-high)]",
    medium: "bg-[var(--priority-medium)]",
    low: "bg-[var(--priority-low)]",
  };

  function shift(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  return (
    <Card className="bg-hero shadow-[var(--shadow-soft)]">
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
            <p className="text-xs text-muted-foreground">
              Today is{" "}
              {today.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" aria-label="Previous month" onClick={() => shift(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            >
              Today
            </Button>
            <Button size="icon" variant="ghost" aria-label="Next month" onClick={() => shift(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            const isToday = date ? sameDay(date, today) : false;
            const isWeekend = date ? date.getDay() === 0 || date.getDay() === 6 : false;
            const dot = date ? dots[localDateKey(date)] : null;
            return (
              <div
                key={i}
                aria-current={isToday ? "date" : undefined}
                className={cn(
                  "relative flex h-11 items-center justify-center rounded-lg text-sm sm:h-12",
                  date ? "bg-card/70" : "bg-transparent",
                  isWeekend && date && "text-muted-foreground",
                  isToday &&
                    "bg-[var(--rose-dust)] font-semibold text-[var(--rose-dust-foreground)] ring-2 ring-[var(--rose-dust-soft)]",
                )}
              >
                {date?.getDate() ?? ""}
                {dot && (
                  <span
                    aria-label={`${dot} priority task`}
                    className={cn(
                      "absolute top-1.5 right-1.5 size-1.5 rounded-full ring-2 ring-[var(--card)]",
                      dotClass[dot],
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
