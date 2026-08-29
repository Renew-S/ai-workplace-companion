import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, ListChecks, Loader2, Sparkles, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { AppLayout, PageHeader, ResponsibleAiNotice } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { planTasks } from "@/lib/ai.functions";
import { logActivity } from "@/lib/history";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Workplace AI" },
      {
        name: "description",
        content:
          "Paste your tasks and let AI build a prioritized daily or weekly schedule with suggested time slots you can edit.",
      },
      { property: "og:title", content: "AI Task Planner — Workplace AI" },
      {
        property: "og:description",
        content: "Turn a messy to-do list into a prioritized, time-blocked plan.",
      },
    ],
  }),
  component: TasksPage,
});

type PlannedTask = {
  id: string;
  title: string;
  priority: string;
  suggestedTime: string;
  rationale: string;
  done: boolean;
};

const priorityStyles: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-primary-soft text-primary-foreground border-primary/30",
  low: "bg-secondary text-secondary-foreground border-border",
};

function TasksPage() {
  const run = useServerFn(planTasks);
  const [input, setInput] = useLocalStorage("wai.tasks.input", "");
  const [mode, setMode] = useLocalStorage<"daily" | "weekly" | "monthly">("wai.tasks.mode", "daily");
  const [tasks, setTasks] = useLocalStorage<PlannedTask[]>("wai.tasks.list", []);
  const [summary, setSummary] = useLocalStorage("wai.tasks.summary", "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (input.trim().length < 3) {
      toast.error("Add at least one task first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await run({ data: { tasks: input, mode } });
      setTasks(
        res.tasks.map((t, i) => ({
          ...t,
          id: `${Date.now()}-${i}`,
          done: false,
        })),
      );
      setSummary(res.summary);
      logActivity("tasks", `${mode[0].toUpperCase()}${mode.slice(1)} plan — ${res.tasks.length} tasks`, res.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function update(id: string, patch: Partial<PlannedTask>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  const completed = tasks.filter((t) => t.done).length;

  return (
    <AppLayout>
      <PageHeader
        title="AI Task Planner"
        description="Drop in your tasks and get a prioritized schedule you can edit, complete and clear."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Your tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tasks">One per line</Label>
              <Textarea
                id="tasks"
                rows={9}
                placeholder={"Finish Q3 report\nCall supplier about delivery\nPrep Monday standup"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Planning horizon</Label>
              <Tabs value={mode} onValueChange={(v) => setMode(v as "daily" | "weekly" | "monthly")}>
                <TabsList className="w-full">
                  <TabsTrigger className="flex-1" value="daily">
                    Daily
                  </TabsTrigger>
                  <TabsTrigger className="flex-1" value="weekly">
                    Weekly
                  </TabsTrigger>
                  <TabsTrigger className="flex-1" value="monthly">
                    Monthly
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={generate} disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Create plan
              </Button>
              <Button
                variant="ghost"
                disabled={loading || tasks.length === 0}
                onClick={() => {
                  setTasks([]);
                  setSummary("");
                }}
              >
                <Trash2 className="size-4" /> Clear plan
              </Button>
            </div>
            <ResponsibleAiNotice />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {summary && tasks.length > 0 && (
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
                <p className="text-muted-foreground">{summary}</p>
                <Badge variant="secondary">
                  {completed}/{tasks.length} done
                </Badge>
              </CardContent>
            </Card>
          )}

          {loading && tasks.length === 0 ? (
            <Card>
              <CardContent className="flex h-64 flex-col items-center justify-center gap-3 pt-6 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" />
                Prioritising your tasks…
              </CardContent>
            </Card>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="flex h-64 flex-col items-center justify-center gap-2 px-6 pt-6 text-center text-sm text-muted-foreground">
                <ListChecks className="size-6 text-primary" />
                No plan yet — add your tasks and create a schedule.
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li key={t.id}>
                  <Card className={cn(t.done && "opacity-60")}>
                    <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-start">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Input
                          value={t.title}
                          onChange={(e) => update(t.id, { title: e.target.value })}
                          className={cn(
                            "border-transparent bg-transparent px-0 text-sm font-medium shadow-none focus-visible:border-input focus-visible:px-3",
                            t.done && "line-through",
                          )}
                        />
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge
                            variant="outline"
                            className={priorityStyles[t.priority.toLowerCase()] ?? ""}
                          >
                            {t.priority}
                          </Badge>
                          <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
                            {t.suggestedTime}
                          </span>
                          <span className="text-muted-foreground">{t.rationale}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={t.done ? "secondary" : "default"}
                          onClick={() => update(t.id, { done: !t.done })}
                        >
                          {t.done ? <Undo2 className="size-4" /> : <Check className="size-4" />}
                          {t.done ? "Undo" : "Done"}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete task"
                          onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
