import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  MessageSquare,
  SendHorizonal,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout, PageHeader, ResponsibleAiNotice } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { chatReply } from "@/lib/ai.functions";
import { logActivity } from "@/lib/history";
import { DEFAULT_SETTINGS, SETTINGS_KEY, type AppSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Workplace Chat — Workplace AI" },
      {
        name: "description",
        content:
          "Ask an AI workplace assistant for practical help with meetings, writing, prioritisation and everyday professional tasks.",
      },
      { property: "og:title", content: "AI Workplace Chat — Workplace AI" },
      {
        property: "og:description",
        content: "Contextual AI answers for everyday workplace questions.",
      },
    ],
  }),
  component: ChatPage,
});

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Help me decline a meeting politely",
  "Draft an agenda for a 30-minute project check-in",
  "How do I give constructive feedback to a teammate?",
];

function ChatPage() {
  const run = useServerFn(chatReply);
  const [messages, setMessages] = useLocalStorage<Message[]>("wai.chat.messages", []);
  const [settings] = useLocalStorage<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useLocalStorage<Record<number, "up" | "down">>(
    "wai.chat.feedback",
    {},
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  function rate(index: number, value: "up" | "down") {
    const current = feedback[index];
    const next = { ...feedback };
    if (current === value) delete next[index];
    else next[index] = value;
    setFeedback(next);
    if (current !== value)
      toast.success(value === "up" ? "Thanks for the feedback!" : "Thanks — we'll aim to improve.");
  }

  async function copyMessage(index: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
      toast.success("Message copied");
    } catch {
      toast.error("Could not copy the message.");
    }
  }

  async function shareMessage(index: number, text: string) {
    const prompt = [...messages.slice(0, index)].reverse().find((m) => m.role === "user")?.content;
    const payload = `Prompt: ${prompt ?? "—"}\n\nAI response:\n${text}`;
    const nav: Navigator = navigator;
    try {
      if (typeof nav.share === "function") {
        await nav.share({ title: "AI Workplace Chat", text: payload });
        return;
      }
      await nav.clipboard.writeText(payload);
      toast.success("Prompt and response copied to share");
    } catch {
      /* user dismissed share sheet */
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await run({
        data: { messages: next, language: settings.language, webSearch: settings.webSearch },
      });
      setMessages([...next, { role: "assistant", content: res.content }]);
      logActivity("chat", content, res.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="AI Workplace Chat"
          description="Ask questions or get help with everyday workplace tasks."
        />
        <Button
          variant="outline"
          size="sm"
          disabled={messages.length === 0}
          onClick={() => {
            setMessages([]);
            setError(null);
          }}
        >
          <Trash2 className="size-4" /> Clear chat
        </Button>
      </div>

      <Card className="flex h-[62vh] min-h-[420px] flex-col overflow-hidden py-0">
        <CardContent className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && !loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <MessageSquare className="size-7 text-primary" />
              <p className="text-base font-semibold">How may I assist today? 😊</p>
              <p className="text-sm text-muted-foreground">
                Start a conversation — try one of these:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} size="sm" variant="secondary" onClick={() => send(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col gap-1.5",
                  m.role === "user" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {m.content}
                </div>
                {m.role === "assistant" && (
                  <div className="flex items-center gap-1 pl-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Like this response"
                      title="Like"
                      className={cn(
                        "size-8 text-muted-foreground hover:text-primary-deep",
                        feedback[i] === "up" && "text-primary-deep",
                      )}
                      onClick={() => rate(i, "up")}
                    >
                      <ThumbsUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Dislike this response"
                      title="Dislike"
                      className={cn(
                        "size-8 text-muted-foreground hover:text-destructive",
                        feedback[i] === "down" && "text-destructive",
                      )}
                      onClick={() => rate(i, "down")}
                    >
                      <ThumbsDown className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Copy message"
                      title="Copy message"
                      className="size-8 text-muted-foreground hover:text-primary-deep"
                      onClick={() => copyMessage(i, m.content)}
                    >
                      {copiedIndex === i ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Share message and prompt"
                      title="Share message and prompt"
                      className="size-8 text-muted-foreground hover:text-primary-deep"
                      onClick={() => shareMessage(i, m.content)}
                    >
                      <Share2 className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" /> Thinking…
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div ref={endRef} />
        </CardContent>

        <div className="border-t bg-card p-3 sm:p-4">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Textarea
              rows={1}
              value={input}
              placeholder="Ask about emails, meetings, planning…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              className="max-h-32 min-h-11 resize-none"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <SendHorizonal className="size-4" />
            </Button>
          </form>
        </div>
      </Card>

      <ResponsibleAiNotice className="mt-4" />
    </AppLayout>
  );
}
