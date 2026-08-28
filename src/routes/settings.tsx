import { createFileRoute } from "@tanstack/react-router";
import { Globe, Search } from "lucide-react";
import { toast } from "sonner";

import { AppLayout, PageHeader, ResponsibleAiNotice } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  DEFAULT_SETTINGS,
  LANGUAGES,
  LOCALES,
  SETTINGS_KEY,
  formatDateTime,
  type AppSettings,
} from "@/lib/settings";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Workplace AI" },
      {
        name: "description",
        content:
          "Choose your assistant language, regional date and time formats, and enable or disable real-time web search for AI answers.",
      },
      { property: "og:title", content: "Settings — Workplace AI" },
      {
        property: "og:description",
        content: "Language, localization formats and web search access for your AI assistant.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useLocalStorage<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <AppLayout>
      <PageHeader
        title="Settings"
        description="Tune how your assistant writes, formats dates and looks things up."
      />

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="size-4 text-primary" /> Language &amp; Localization
            </CardTitle>
            <CardDescription>
              Applies to AI responses and how dates and times are displayed.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Assistant language</Label>
              <Select value={settings.language} onValueChange={(v) => set("language", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={settings.locale} onValueChange={(v) => set("locale", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date format</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(v) => set("dateFormat", v as AppSettings["dateFormat"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Regional default</SelectItem>
                  <SelectItem value="dmy">Day / Month / Year</SelectItem>
                  <SelectItem value="mdy">Month / Day / Year</SelectItem>
                  <SelectItem value="iso">ISO (YYYY-MM-DD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time format</Label>
              <Select
                value={settings.timeFormat}
                onValueChange={(v) => set("timeFormat", v as AppSettings["timeFormat"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24-hour</SelectItem>
                  <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground sm:col-span-2">
              Preview: {formatDateTime(Date.now(), settings)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="size-4 text-primary" /> Web search access
            </CardTitle>
            <CardDescription>
              When enabled, the assistant may look up real-time information for chat answers.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Real-time web search</p>
              <p className="text-xs text-muted-foreground">
                Off keeps answers based on the assistant&apos;s existing knowledge only.
              </p>
            </div>
            <Switch
              checked={settings.webSearch}
              onCheckedChange={(v) => {
                set("webSearch", v);
                toast.success(v ? "Web search enabled" : "Web search disabled");
              }}
              aria-label="Toggle real-time web search"
            />
          </CardContent>
        </Card>

        <div>
          <Button variant="outline" onClick={() => setSettings(DEFAULT_SETTINGS)}>
            Reset to defaults
          </Button>
        </div>

        <ResponsibleAiNotice />
      </div>
    </AppLayout>
  );
}
