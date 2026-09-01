import { Link } from "@tanstack/react-router";
import { Bell, ListChecks } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocalStorage } from "@/hooks/use-local-storage";

type PlannedTask = {
  id: string;
  title: string;
  priority: string;
  suggestedTime: string;
  done: boolean;
};

type Plans = Record<string, { summary: string; tasks: PlannedTask[] }>;

const MODE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function NotificationsBell() {
  const [plans] = useLocalStorage<Plans>("wai.tasks.plans", {});
  const [open, setOpen] = useState(false);

  const due = Object.entries(plans ?? {}).flatMap(([mode, plan]) =>
    (plan?.tasks ?? []).filter((t) => !t.done).map((t) => ({ ...t, mode })),
  );
  const urgent = due.filter((t) => t.priority?.toLowerCase() === "high").length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Notifications: ${due.length} tasks due`}
          title="Task reminders"
          className="relative text-primary-deep"
        >
          <Bell className="size-4" />
          {due.length > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-[var(--shadow-glow)]">
              {due.length > 9 ? "9+" : due.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Task reminders</p>
          {urgent > 0 && <Badge variant="secondary">{urgent} high priority</Badge>}
        </div>

        {due.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
            <ListChecks className="size-5 text-primary" />
            You&apos;re all caught up — no tasks due.
          </div>
        ) : (
          <ul className="max-h-72 divide-y overflow-y-auto">
            {due.slice(0, 12).map((t) => (
              <li key={`${t.mode}-${t.id}`} className="px-4 py-2.5">
                <p className="truncate text-sm font-medium">{t.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {MODE_LABELS[t.mode] ?? t.mode} • {t.priority} • {t.suggestedTime}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t p-3">
          <Button asChild size="sm" className="w-full" onClick={() => setOpen(false)}>
            <Link to="/tasks">Open Task Planner</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
