import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function MonthCalendar() {
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
            return (
              <div
                key={i}
                aria-current={isToday ? "date" : undefined}
                className={cn(
                  "flex h-11 items-center justify-center rounded-lg text-sm sm:h-12",
                  date ? "bg-card/70" : "bg-transparent",
                  isWeekend && date && "text-muted-foreground",
                  isToday &&
                    "bg-[var(--rose-dust)] font-semibold text-[var(--rose-dust-foreground)] ring-2 ring-[var(--rose-dust-soft)]",
                )}
              >
                {date?.getDate() ?? ""}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
