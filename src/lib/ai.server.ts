import { z } from "zod";

type Msg = { role: "system" | "user" | "assistant"; content: string };

const MODEL = "google/gemini-3.7-flash";
const FALLBACK_MODEL = "google/gemini-2.5-flash";

type ChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string }> | null;
      reasoning?: string | null;
      reasoning_content?: string | null;
    };
  }>;
};

function extractText(data: ChatResponse): string {
  const msg = data.choices?.[0]?.message;
  if (!msg) return "";
  const raw = msg.content;
  const text = Array.isArray(raw)
    ? raw.map((p) => p?.text ?? "").join("")
    : typeof raw === "string"
      ? raw
      : "";
  return (text || msg.reasoning || msg.reasoning_content || "").trim();
}

async function request(key: string, model: string, messages: Msg[]): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429)
      throw new Error("Too many requests right now — please wait a moment and try again.");
    if (res.status === 402)
      throw new Error("AI credits are exhausted. Please add credits to continue.");
    throw new Error(`AI request failed (${res.status}). ${text.slice(0, 200)}`);
  }

  return extractText((await res.json()) as ChatResponse);
}

export async function callAI(messages: Msg[]): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this app.");

  let content = await request(key, MODEL, messages);
  if (!content) content = await request(key, FALLBACK_MODEL, messages);
  if (!content) throw new Error("The AI returned an empty response. Please try again.");
  return content;
}


export const PlanSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      priority: z.string(),
      suggestedTime: z.string(),
      rationale: z.string(),
    }),
  ),
  summary: z.string(),
});

