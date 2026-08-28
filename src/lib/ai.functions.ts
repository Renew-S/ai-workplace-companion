import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "google/gemini-3.7-flash";

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function callAI(messages: Msg[]): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this app.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429)
      throw new Error("Too many requests right now — please wait a moment and try again.");
    if (res.status === 402)
      throw new Error("AI credits are exhausted. Please add credits to continue.");
    throw new Error(`AI request failed (${res.status}). ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("The AI returned an empty response. Please try again.");
  return content;
}

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        brief: z.string().min(3),
        tone: z.string(),
        recipient: z.string().optional(),
        sender: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const content = await callAI([
      {
        role: "system",
        content:
          "You are an expert workplace communication assistant. Write complete, ready-to-send professional emails. " +
          "Always start with a 'Subject: ...' line, then a greeting, well-structured short paragraphs, and a sign-off. " +
          "Never use placeholders like [Your Name] unless the information is genuinely unknown — if unknown, keep them minimal. " +
          "Return plain text only, no markdown formatting or commentary.",
      },
      {
        role: "user",
        content: [
          `Tone: ${data.tone}`,
          data.recipient ? `Recipient: ${data.recipient}` : "",
          data.sender ? `Sender: ${data.sender}` : "",
          `What the email should be about:\n${data.brief}`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ]);
    return { content };
  });

const PlanSchema = z.object({
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

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ tasks: z.string().min(3), mode: z.enum(["daily", "weekly"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    const raw = await callAI([
      {
        role: "system",
        content:
          "You are a productivity planning assistant. Given a list of workplace tasks, produce a prioritized " +
          `${data.mode} schedule using urgency and importance (Eisenhower style). ` +
          'Respond with ONLY valid minified JSON of shape {"summary":string,"tasks":[{"title":string,"priority":"High"|"Medium"|"Low","suggestedTime":string,"rationale":string}]}. ' +
          (data.mode === "daily"
            ? "suggestedTime should be a clock slot like '09:00 - 10:00'."
            : "suggestedTime should be a weekday plus slot like 'Mon, 09:00 - 10:30'.") +
          " Keep rationale under 15 words. No markdown fences.",
      },
      { role: "user", content: data.tasks },
    ]);

    const cleaned = raw
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    try {
      return PlanSchema.parse(JSON.parse(cleaned));
    } catch {
      throw new Error("Could not read the AI plan. Please try generating again.");
    }
  });

export const chatReply = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        messages: z.array(
          z.object({ role: z.enum(["user", "assistant"]), content: z.string() }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const content = await callAI([
      {
        role: "system",
        content:
          "You are a helpful workplace productivity assistant for busy professionals. Give practical, specific, " +
          "actionable answers about emails, meetings, planning, prioritisation, difficult conversations, documents and " +
          "workplace processes. Be concise (under 200 words unless asked for more), use short paragraphs or bullet lines " +
          "with '- '. Avoid legal, medical or HR-binding advice; suggest consulting the right person instead.",
      },
      ...data.messages.slice(-20),
    ]);
    return { content };
  });
