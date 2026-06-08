import { useState } from "react";
import { ArrowUp, Loader2, X, Workflow, Sparkles } from "lucide-react";
import { generatePathwayAI } from "../../api";
import type { Pathway } from "../../types";

type ChatMessage = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  {
    icon: Workflow,
    label: "Create a workflow",
    prompt:
      "Diabetic patients: text them weekly to log blood sugar; if no reply for 3 days, call them; book a quarterly check-up.",
  },
  {
    icon: Sparkles,
    label: "Post-op follow-up",
    prompt:
      "Post-surgery: confirm the wound-check appointment, escalate to a nurse if the patient reports pain.",
  },
];

export function AiAssistant({
  department,
  onPathway,
  onClose,
}: {
  department: string;
  onPathway: (p: Pathway) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit(text: string) {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setLoading(true);
    try {
      const pathway = await generatePathwayAI(prompt, department);
      onPathway(pathway);
      setMessages((m) => [
        ...m,
        { role: "ai", text: `Built “${pathway.name}” with ${pathway.steps.length} steps. Loaded on the canvas ✓` },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "ai", text: `Couldn't build that: ${e instanceof Error ? e.message : "unknown error"}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-600" />
          <span className="text-sm font-medium text-ink">AI Assistant</span>
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-ink">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-sm text-stone-400">
            <p>Hi! Tell me the clinical workflow you need and I'll build it on the canvas.</p>
            <div className="mt-4 space-y-2">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => submit(s.prompt)}
                    className="flex w-full items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-left text-xs text-stone-600 transition hover:border-fuchsia-300 hover:bg-fuchsia-50/40"
                  >
                    <Icon className="size-3.5 shrink-0 text-fuchsia-500" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-6 rounded-xl rounded-br-sm bg-ink-soft px-3 py-2 text-sm text-white"
                : "mr-6 rounded-xl rounded-bl-sm bg-stone-100 px-3 py-2 text-sm text-ink"
            }
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div className="mr-6 flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-500">
            <Loader2 className="size-4 animate-spin" /> Designing the pathway…
          </div>
        )}
      </div>

      <div className="border-t border-stone-200 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-stone-200 px-3 py-2 focus-within:border-fuchsia-300">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            rows={2}
            placeholder="Describe a workflow…"
            className="flex-1 resize-none text-sm outline-none placeholder:text-stone-400"
          />
          <button
            onClick={() => submit(input)}
            disabled={loading || !input.trim()}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ink-soft text-white transition hover:bg-ink disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
