import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Eraser, Loader2, RefreshCw, Sparkles, Mail } from "lucide-react";
import { toast } from "sonner";

import { AppLayout, PageHeader, ResponsibleAiNotice } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { generateEmail } from "@/lib/ai.functions";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Workplace AI" },
      {
        name: "description",
        content:
          "Describe your message and generate a complete, professional email in a formal, friendly, persuasive, direct or urgent tone.",
      },
      { property: "og:title", content: "Smart Email Generator — Workplace AI" },
      {
        property: "og:description",
        content: "Generate editable, ready-to-send professional emails with AI.",
      },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Formal", "Friendly", "Persuasive", "Direct", "Urgent"];

function EmailPage() {
  const run = useServerFn(generateEmail);
  const [brief, setBrief] = useLocalStorage("wai.email.brief", "");
  const [tone, setTone] = useLocalStorage("wai.email.tone", "Formal");
  const [recipient, setRecipient] = useLocalStorage("wai.email.recipient", "");
  const [sender, setSender] = useLocalStorage("wai.email.sender", "");
  const [output, setOutput] = useLocalStorage("wai.email.output", "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (brief.trim().length < 3) {
      toast.error("Tell the AI what the email should be about first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await run({ data: { brief, tone, recipient, sender } });
      setOutput(res.content);
      logActivity("email", brief, res.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setBrief("");
    setOutput("");
    setError(null);
  }

  return (
    <AppLayout>
      <PageHeader
        title="Smart Email Generator"
        description="Describe your message, pick a tone, and get a complete email you can edit and send."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What's the email about?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brief">Brief</Label>
              <Textarea
                id="brief"
                rows={7}
                placeholder="e.g. Ask the finance team for an update on the Q3 invoice approvals and request a response by Thursday."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient (optional)</Label>
                <Input
                  id="recipient"
                  placeholder="Thabo, Finance Manager"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender">Your name (optional)</Label>
                <Input
                  id="sender"
                  placeholder="Sharon"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={generate} disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {output ? "Generate" : "Generate email"}
              </Button>
              <Button variant="outline" onClick={generate} disabled={loading || !output}>
                <RefreshCw className="size-4" /> Regenerate
              </Button>
              <Button variant="ghost" onClick={clearAll} disabled={loading}>
                <Eraser className="size-4" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Your email</CardTitle>
            <Button
              variant="outline"
              size="sm"
              disabled={!output}
              onClick={() => {
                navigator.clipboard.writeText(output);
                toast.success("Email copied to clipboard");
              }}
            >
              <Copy className="size-4" /> Copy
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            {loading && !output ? (
              <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" />
                Writing your email…
              </div>
            ) : output ? (
              <Textarea
                rows={18}
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                className="font-mono text-[13px] leading-relaxed"
              />
            ) : (
              <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 text-center text-sm text-muted-foreground">
                <Mail className="size-6 text-primary" />
                Your generated email will appear here, fully editable.
              </div>
            )}
            <ResponsibleAiNotice />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
