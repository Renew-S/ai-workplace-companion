import { Link } from "@tanstack/react-router";
import { Bell, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { isTaskOverdue } from "@/lib/task-deadlines";

type PlannedTask = {
  id: string;
  title: string;
  priority: string;
  suggestedTime: string;
  dueDate?: string;
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
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const due = Object.entries(plans ?? {}).flatMap(([mode, plan]) =>
    (plan?.tasks ?? []).filter((t) => !t.done).map((t) => ({ ...t, mode, overdue: isTaskOverdue(t, mode, now) })),
  ).sort((a, b) => Number(b.overdue) - Number(a.overdue));
  const overdueCount = due.filter((t) => t.overdue).length;
  const urgent = due.filter((t) => t.priority?.toLowerCase() === "high").length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={overdueCount > 0 ? `Notifications: ${overdueCount} overdue tasks, ${due.length} incomplete tasks` : `Notifications: ${due.length} incomplete tasks`}
          title={overdueCount > 0 ? `${overdueCount} overdue task${overdueCount === 1 ? "" : "s"}` : "Task reminders"}
          className={`relative ${overdueCount > 0 ? "border-destructive text-destructive" : "text-primary-deep"}`}
        >
          <Bell className={`size-4 ${overdueCount > 0 ? "motion-safe:animate-pulse" : ""}`} />
          {due.length > 0 && (
            <span className={`absolute -right-1 -top-1 flex min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${overdueCount > 0 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"}`}>
              {(overdueCount > 0 ? overdueCount : due.length) > 9 ? "9+" : overdueCount > 0 ? overdueCount : due.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Task reminders</p>
          {urgent > 0 && <Badge variant="secondary">{urgent} high priority</Badge>}
        </div>

        {overdueCount > 0 && (
          <p role="status" className="border-b border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
            {overdueCount} overdue {overdueCount === 1 ? "task needs" : "tasks need"} attention. Complete or reschedule {overdueCount === 1 ? "it" : "them"} in Task Planner.
          </p>
        )}

        {due.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
            <ListChecks className="size-5 text-primary" />
            You&apos;re all caught up — no tasks due.
          </div>
        ) : (
          <ul className="max-h-72 divide-y overflow-y-auto">
            {due.slice(0, 12).map((t) => (
              <li key={`${t.mode}-${t.id}`} className={`px-4 py-2.5 ${t.overdue ? "bg-destructive/5" : ""}`}>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  {t.overdue && <span className="shrink-0 text-xs font-semibold text-destructive">Overdue</span>}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {MODE_LABELS[t.mode] ?? t.mode} • {t.priority} • {t.dueDate ?? t.suggestedTime}
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
