import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { History as HistoryIcon, Mail, ListChecks, MessageSquare, Trash2 } from "lucide-react";

import { AppLayout, PageHeader, ResponsibleAiNotice } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { readHistory, writeHistory, type ActivityItem } from "@/lib/history";
import { DEFAULT_SETTINGS, SETTINGS_KEY, formatDateTime, type AppSettings } from "@/lib/settings";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Activity History — Workplace AI" },
      {
        name: "description",
        content:
          "Review your previous AI activity: generated emails, task plans and chat conversations, stored privately in your browser.",
      },
      { property: "og:title", content: "Activity History — Workplace AI" },
      {
        property: "og:description",
        content: "A private timeline of everything you have generated with Workplace AI.",
      },
    ],
  }),
  component: HistoryPage,
});

const icons = { email: Mail, tasks: ListChecks, chat: MessageSquare } as const;
const labels = { email: "Email", tasks: "Task plan", chat: "Chat" } as const;

function HistoryPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [settings] = useLocalStorage<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);

  useEffect(() => {
    const sync = () => setItems(readHistory());
    sync();
    window.addEventListener("wai:history", sync);
    return () => window.removeEventListener("wai:history", sync);
  }, []);

  return (
    <AppLayout>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Activity History"
          description="Everything you've generated recently, kept privately in this browser."
        />
        <Button
          variant="outline"
          size="sm"
          disabled={items.length === 0}
          onClick={() => {
            writeHistory([]);
            setItems([]);
          }}
        >
          <Trash2 className="size-4" /> Clear history
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center gap-2 px-6 pt-6 text-center text-sm text-muted-foreground">
            <HistoryIcon className="size-6 text-primary" />
            No activity yet — generate an email, plan or chat reply and it will show up here.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const Icon = icons[item.kind];
            return (
              <li key={item.id}>
                <Card>
                  <CardContent className="flex gap-3 pt-6">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{item.title}</p>
                        <Badge variant="secondary">{labels[item.kind]}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(item.at, settings)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ResponsibleAiNotice className="mt-4" />
    </AppLayout>
  );
}
