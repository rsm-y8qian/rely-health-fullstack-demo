import Anthropic from "@anthropic-ai/sdk";
import type { Pathway } from "../pathways/types.js";
import { capabilities, eventTypes } from "../pathways/capabilities.js";
import {
  addStep,
  connectSteps,
  updateStep,
  deleteStep,
  setStart,
  validatePathway,
} from "./pathwayTools.js";

const VALID_EVENTS = eventTypes.map((e) => e.event);

// The tools the agent may call. Inputs are JSON-schema constrained, so the
// model can only call them in well-formed ways (a guardrail in itself).
const tools: Anthropic.Tool[] = [
  { name: "get_pathway", description: "Read the current pathway (steps + transitions).", input_schema: { type: "object", properties: {} } },
  { name: "list_capabilities", description: "List the available action blocks and the valid transition events.", input_schema: { type: "object", properties: {} } },
  {
    name: "add_step",
    description: "Add a new step. Use a short snake_case id.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        action: { type: "string", description: "One of the available capability actions." },
        waitHours: { type: "number", description: "Optional wait before this step." },
      },
      required: ["id", "name", "action"],
    },
  },
  {
    name: "connect_steps",
    description: "Add a transition: when `event` happens at step `from`, go to step `to`.",
    input_schema: {
      type: "object",
      properties: {
        from: { type: "string" },
        event: { type: "string", enum: VALID_EVENTS },
        to: { type: "string" },
      },
      required: ["from", "event", "to"],
    },
  },
  {
    name: "update_step",
    description: "Change a step's name, action, or waitHours.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        action: { type: "string" },
        waitHours: { type: "number" },
      },
      required: ["id"],
    },
  },
  { name: "delete_step", description: "Delete a step (its dangling transitions are cleaned up).", input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "set_start", description: "Set which step the pathway starts at.", input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  {
    name: "create_capability",
    description:
      "Create a NEW declarative action block when an existing one doesn't fit (e.g. send_voicemail). It becomes available immediately. This adds metadata only — never code.",
    input_schema: {
      type: "object",
      properties: {
        action: { type: "string", description: "snake_case id, e.g. send_voicemail" },
        label: { type: "string" },
        description: { type: "string" },
      },
      required: ["action", "label", "description"],
    },
  },
];

export interface AgentResult {
  pathway: Pathway;
  reply: string;
  actions: string[];
  validation: { ok: boolean; errors: string[] };
}

export async function agentEditPathway(prompt: string, initial: Pathway): Promise<AgentResult> {
  const client = new Anthropic();
  let working = structuredClone(initial);
  const actions: string[] = [];

  const system = `You are an assistant that edits clinical care pathways for a hybrid human-AI patient platform, by calling tools.

A pathway is a state machine: steps perform an action when entered; transitions (triggered by events) move the patient to the next step.

Rules:
- Make the smallest set of changes that satisfies the request — do NOT rebuild the whole pathway.
- Only use valid events: ${VALID_EVENTS.join(", ")}.
- Prefer existing capabilities; only create_capability when none fits.
- Keep exactly one terminal "complete" step and make sure every step you add is reachable.
- When you are done, stop calling tools and give a one-sentence summary.`;

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Current pathway:\n${JSON.stringify(working)}\n\nAvailable capabilities: ${capabilities
        .map((c) => c.action)
        .join(", ")}\n\nRequest: ${prompt}`,
    },
  ];

  let reply = "";
  for (let i = 0; i < 8; i++) {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      tools,
      messages,
    });

    reply = res.content.filter((b) => b.type === "text").map((b) => (b as Anthropic.TextBlock).text).join(" ");
    if (res.stop_reason !== "tool_use") break;

    messages.push({ role: "assistant", content: res.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== "tool_use") continue;
      const { working: next, message, isError } = runTool(block.name, block.input as Record<string, unknown>, working);
      working = next;
      actions.push(message);
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: message, is_error: isError });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return { pathway: working, reply, actions, validation: validatePathway(working) };
}

function runTool(
  name: string,
  input: Record<string, unknown>,
  working: Pathway,
): { working: Pathway; message: string; isError: boolean } {
  switch (name) {
    case "get_pathway":
      return { working, message: JSON.stringify(working), isError: false };
    case "list_capabilities":
      return { working, message: JSON.stringify({ capabilities, events: VALID_EVENTS }), isError: false };
    case "add_step": {
      const r = addStep(working, input as never);
      return { working: r.pathway, message: r.message, isError: !r.ok };
    }
    case "connect_steps": {
      const r = connectSteps(working, input as never);
      return { working: r.pathway, message: r.message, isError: !r.ok };
    }
    case "update_step": {
      const r = updateStep(working, input as never);
      return { working: r.pathway, message: r.message, isError: !r.ok };
    }
    case "delete_step": {
      const r = deleteStep(working, input as never);
      return { working: r.pathway, message: r.message, isError: !r.ok };
    }
    case "set_start": {
      const r = setStart(working, input as never);
      return { working: r.pathway, message: r.message, isError: !r.ok };
    }
    case "create_capability": {
      const action = String(input.action);
      if (!capabilities.some((c) => c.action === action)) {
        capabilities.push({ action: action as never, label: String(input.label), description: String(input.description), icon: "Sparkles" });
      }
      return { working, message: `Created capability "${action}".`, isError: false };
    }
    default:
      return { working, message: `Unknown tool "${name}".`, isError: true };
  }
}
