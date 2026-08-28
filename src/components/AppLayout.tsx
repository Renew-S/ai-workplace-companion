import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, LayoutDashboard, Mail, ListChecks, MessageSquare, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email", label: "Email Generator", icon: Mail },
  { to: "/tasks", label: "Task Planner", icon: ListChecks },
  { to: "/chat", label: "AI Chat", icon: MessageSquare },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
        <Sparkles className="size-4.5" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold">Workplace AI</span>
        <span className="block text-xs text-muted-foreground">Productivity Assistant</span>
      </span>
    </div>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="mt-6 flex flex-col gap-1">
      {nav.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ResponsibleAiNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "rounded-lg border border-dashed bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      <span className="font-medium text-foreground">Responsible AI:</span> AI-generated content may
      contain errors or omissions. Always review outputs for accuracy, privacy, confidentiality and
      appropriateness before using them professionally.
    </p>
  );
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar p-4 lg:flex">
        <Brand />
        <NavItems />
        <div className="mt-auto">
          <ResponsibleAiNotice />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <NavItems onNavigate={() => setOpen(false)} />
              <div className="mt-6">
                <ResponsibleAiNotice />
              </div>
            </SheetContent>
          </Sheet>
          <Brand />
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
