import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { capabilities, eventTypes } from "../pathways/capabilities.js";
import type { ActionType, EventType, Pathway } from "../pathways/types.js";

const ACTIONS = capabilities.map((c) => c.action) as [string, ...string[]];
const EVENTS = eventTypes.map((e) => e.event) as [string, ...string[]];

// The shape we force Claude to produce. Enums = it can ONLY pick known actions
// and events — that's the first guardrail (structural).
const AiPathwaySchema = z.object({
  name: z.string(),
  startStepId: z.string(),
  steps: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      action: z.enum(ACTIONS),
      waitHours: z.number().nullable(),
      transitions: z.array(
        z.object({
          event: z.enum(EVENTS),
          to: z.string(),
        }),
      ),
    }),
  ),
});

export async function generatePathway(
  prompt: string,
  department?: string,
): Promise<{ pathway: Pathway } | { error: string }> {
  const client = new Anthropic();

  const actionList = capabilities
    .map((c) => `- ${c.action}: ${c.label} (${c.description})`)
    .join("\n");
  const eventList = eventTypes.map((e) => `- ${e.event}`).join("\n");

  const system = `You design clinical care pathways as structured data for Rely Health, a hybrid human-AI patient orchestration platform.

A pathway is a state machine: each step performs ONE action when the patient enters it, and transitions (triggered by events) move the patient to the next step.

You may ONLY use these actions:
${actionList}

You may ONLY use these events to trigger transitions:
${eventList}

Rules:
- Include exactly one terminal step that uses the "complete" action (no transitions).
- startStepId and every transition "to" MUST be the id of a step you define.
- Keep it clinically sensible. Never invent actions or events outside the lists above.
- waitHours is how long a step waits before a timer fires; use null when not applicable.`;

  try {
    const res = await client.messages.parse({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system,
      messages: [
        {
          role: "user",
          content: `Department: ${department ?? "General"}.\nBuild a clinical pathway for: ${prompt}`,
        },
      ],
      output_config: { format: zodOutputFormat(AiPathwaySchema) },
    });

    const out = res.parsed_output;
    if (!out) return { error: "The AI did not return a valid pathway." };

    // Semantic guardrail: the graph must be internally consistent.
    const ids = new Set(out.steps.map((s) => s.id));
    if (!ids.has(out.startStepId)) {
      return { error: `Generated startStepId "${out.startStepId}" is not a defined step.` };
    }
    for (const s of out.steps) {
      for (const t of s.transitions) {
        if (!ids.has(t.to)) {
          return { error: `Step "${s.id}" points to a missing step "${t.to}".` };
        }
      }
    }

    // Transform the AI shape into our engine's Pathway shape.
    const pathway: Pathway = {
      id: `ai-${Date.now()}`,
      name: out.name,
      department,
      startStepId: out.startStepId,
      steps: out.steps.map((s) => ({
        id: s.id,
        name: s.name,
        action: s.action as ActionType,
        waitHours: s.waitHours ?? undefined,
        transitions: Object.fromEntries(
          s.transitions.map((t) => [t.event, t.to]),
        ) as Partial<Record<EventType, string>>,
      })),
    };

    return { pathway };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "AI request failed." };
  }
}
