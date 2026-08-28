import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, ListChecks, MessageSquare, ArrowRight, ShieldCheck, Zap } from "lucide-react";

import { AppLayout, ResponsibleAiNotice } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workplace AI — AI Productivity Assistant for Professionals" },
      {
        name: "description",
        content:
          "Draft professional emails, build prioritized task plans and chat with an AI workplace assistant — all in one clean productivity workspace.",
      },
      { property: "og:title", content: "Workplace AI — AI Productivity Assistant" },
      {
        property: "og:description",
        content:
          "Draft emails, plan your day and get instant workplace answers with context-aware AI.",
      },
    ],
  }),
  component: Dashboard,
});

const features = [
  {
    to: "/email" as const,
    icon: Mail,
    title: "Smart Email Generator",
    description: "Turn a rough idea into a polished, ready-to-send email in your chosen tone.",
  },
  {
    to: "/tasks" as const,
    icon: ListChecks,
    title: "AI Task Planner",
    description: "Paste your to-dos and get a prioritized daily or weekly schedule.",
  },
  {
    to: "/chat" as const,
    icon: MessageSquare,
    title: "AI Workplace Chat",
    description: "Ask anything about meetings, writing, planning or tricky conversations.",
  },
];

function Dashboard() {
  return (
    <AppLayout>
      <section className="overflow-hidden rounded-2xl bg-hero p-6 shadow-[var(--shadow-soft)] sm:p-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Zap className="size-3.5 text-primary" /> Powered by AI
        </span>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold sm:text-4xl">
          Get workplace work done, faster.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Context-aware AI for the everyday tasks that eat your day: writing emails, planning
          priorities, and answering workplace questions.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/email">
              Write an email <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/tasks">Plan my day</Link>
          </Button>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Link key={f.to} to={f.to} className="group">
            <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-soft)]">
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-foreground">
                  <f.icon className="size-5" />
                </span>
                <CardTitle className="mt-3 text-base">{f.title}</CardTitle>
                <CardDescription>{f.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                Open <ArrowRight className="ml-1 inline size-3.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" /> Responsible AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsibleAiNotice />
          <p className="mt-3 text-xs text-muted-foreground">
            Your drafts, tasks and conversations are stored only in this browser. No account needed.
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
