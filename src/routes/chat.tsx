import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Paperclip,
  X,
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
import { chatReply, transcribeAudio } from "@/lib/ai.functions";
import { blobToBase64, startRecording, type Recorder } from "@/lib/audio";

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

type Attachment = {
  name: string;
  mimeType: string;
  kind: "image" | "pdf" | "text";
  dataUrl?: string;
  text?: string;
};

const SUGGESTIONS = [
  "Help me decline a meeting politely",
  "Draft an agenda for a 30-minute project check-in",
  "How do I give constructive feedback to a teammate?",
];

function ChatPage() {
  const run = useServerFn(chatReply);
  const transcribe = useServerFn(transcribeAudio);
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<Recorder | null>(null);

  async function toggleVoice() {
    if (transcribing) return;

    if (listening) {
      const recorder = recorderRef.current;
      recorderRef.current = null;
      setListening(false);
      if (!recorder) return;
      setTranscribing(true);
      try {
        const blob = await recorder.stop();
        if (blob.size < 4096) {
          toast.error("That recording was empty — please try again.");
          return;
        }
        const audioBase64 = await blobToBase64(blob);
        const res = await transcribe({
          data: { audioBase64, mimeType: "audio/wav", language: settings.language },
        });
        const text = res.text.trim();
        if (!text) {
          toast.error("No speech detected — please try again.");
          return;
        }
        setInput((prev) => (prev ? `${prev.trim()} ${text}` : text));
        toast.success("Voice captured");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not transcribe your voice.");
      } finally {
        setTranscribing(false);
      }
      return;
    }

    try {
      recorderRef.current = await startRecording();
      setListening(true);
      toast.success("Listening… tap the mic again when you're done.");
    } catch (e) {
      const message =
        e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError")
          ? "Microphone access was blocked. Allow it in your browser settings."
          : e instanceof DOMException && e.name === "NotFoundError"
            ? "No microphone was found on this device."
            : e instanceof Error
              ? e.message
              : "Could not start the microphone.";
      toast.error(message);
    }
  }


  function kindFor(file: File): Attachment["kind"] | null {
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "application/pdf") return "pdf";
    if (
      file.type.startsWith("text/") ||
      /\.(txt|md|csv|json|ts|tsx|js|jsx|html|css|yml|yaml|log)$/i.test(file.name) ||
      file.type === "application/json"
    )
      return "text";
    return null;
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const next: Attachment[] = [];
    for (const file of Array.from(files).slice(0, 5)) {
      const kind = kindFor(file);
      if (!kind) {
        toast.error(`${file.name}: unsupported file type. Use images, PDFs or text files.`);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 8MB.`);
        continue;
      }
      try {
        if (kind === "text") {
          next.push({
            name: file.name,
            mimeType: file.type || "text/plain",
            kind,
            text: await file.text(),
          });
        } else {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("read failed"));
            reader.readAsDataURL(file);
          });
          next.push({ name: file.name, mimeType: file.type, kind, dataUrl });
        }
      } catch {
        toast.error(`Could not read ${file.name}.`);
      }
    }
    if (next.length) setAttachments((prev) => [...prev, ...next].slice(0, 5));
  }

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
    if ((!content && attachments.length === 0) || loading) return;
    const label = attachments.length
      ? `${content || "Please review the attached file(s)."}\n\n📎 ${attachments.map((a) => a.name).join(", ")}`
      : content;
    const sent = attachments;
    const next: Message[] = [...messages, { role: "user", content: label }];
    setMessages(next);
    setInput("");
    setAttachments([]);
    setLoading(true);
    setError(null);
    try {
      const res = await run({
        data: {
          messages: next,
          language: settings.language,
          webSearch: settings.webSearch,
          attachments: sent,
        },
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
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <span
                  key={`${a.name}-${i}`}
                  className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-foreground"
                >
                  <Paperclip className="size-3 text-primary-deep" />
                  {a.name}
                  <button
                    type="button"
                    aria-label={`Remove ${a.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,application/pdf,text/*,.md,.csv,.json,.log,.yml,.yaml"
              onChange={(e) => {
                void addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Upload a file"
              title="Upload a file"
              className="text-primary-deep"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="size-4" />
            </Button>
            <Button
              type="button"
              variant={listening ? "default" : "outline"}
              size="icon"
              aria-label={listening ? "Stop voice input" : "Speak your prompt"}
              title={listening ? "Stop listening" : "Speak your prompt"}
              className={cn(!listening && "text-primary-deep", listening && "animate-pulse")}
              onClick={toggleVoice}
            >
              {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </Button>
            <Textarea
              rows={1}
              value={input}
              placeholder="Ask about emails, meetings, planning, or an uploaded file…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              className="max-h-32 min-h-11 resize-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || (!input.trim() && attachments.length === 0)}
            >
              <SendHorizonal className="size-4" />
            </Button>
          </form>
        </div>
      </Card>

      <ResponsibleAiNotice className="mt-4" />
    </AppLayout>
  );
}
