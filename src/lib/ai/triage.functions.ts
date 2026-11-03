import { createServerFn } from "@tanstack/react-start";
import type { TriageResult } from "./triage";

type TriageInput = { tickets: { id: string; subject: string; category: string; message: string }[] };

/** Classifies support tickets by urgency (1–5) with a short reason, via Lovable AI Gateway. */
export const triageTickets = createServerFn({ method: "POST" })
  .inputValidator((d: TriageInput) => {
    if (!d || !Array.isArray(d.tickets)) throw new Error("Invalid input");
    return {
      tickets: d.tickets.slice(0, 60).map((t) => ({
        id: String(t.id).slice(0, 40),
        subject: String(t.subject).slice(0, 200),
        category: String(t.category).slice(0, 60),
        message: String(t.message).slice(0, 600),
      })),
    };
  })
  .handler(async ({ data }): Promise<{ results: TriageResult[]; error?: string }> => {
    if (data.tickets.length === 0) return { results: [] };
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions:
          "You triage support tickets for RD4X, a software product with license keys. For each ticket, assign urgency 1-5 (5 = critical: security breach, payment/charge problems, outage for many users, account lockout; 1 = trivial question or feedback). Give a short reason in Brazilian Portuguese (max 90 characters).",
        input: JSON.stringify(data.tickets),
        text: {
          format: {
            type: "json_schema",
            name: "triage",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["results"],
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["id", "urgency", "reason"],
                    properties: {
                      id: { type: "string" },
                      urgency: { type: "integer", minimum: 1, maximum: 5 },
                      reason: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") {
          for (const c of item.content) if (c.type === "output_text") text += c.text;
        }
      }
      const parsed = JSON.parse(text) as { results: TriageResult[] };
      return { results: parsed.results };
    } catch (e) {
      console.error("triage failed", e instanceof GatewayError ? { code: e.code, ids: e.ids } : e);
      return { results: [], error: "A classificação por IA está indisponível agora." };
    }
  });
