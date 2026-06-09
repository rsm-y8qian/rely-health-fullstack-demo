import { useState } from "react";
import { ArrowUp, Loader2, X, Plus, GitBranch, AlertTriangle } from "lucide-react";
import { agentEditPathway } from "../../api";
import type { Pathway } from "../../types";

type ChatMessage = { role: "user" | "ai"; text: string; warn?: boolean };

const SUGGESTIONS = [
  { icon: Plus, label: "Add a step", prompt: "Add a medication-reminder text 2 days after the first step." },
  {
    icon: GitBranch,
    label: "Add a branch",
    prompt: "If the patient reports a problem, notify a pharmacist (create that block if needed).",
  },
];

export function AiAssistant({
  pathway,
  onPathway,
  onClose,
}: {
  pathway: Pathway | null;
  onPathway: (p: Pathway) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit(text: string) {
    const prompt = text.trim();
    if (!prompt || loading || !pathway) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setLoading(true);
    try {
      const result = await agentEditPathway(prompt, pathway);
      onPathway(result.pathway);
      const summary = result.actions.filter((a) => !a.startsWith("{")).join("\n");
      setMessages((m) => [
        ...m,
        { role: "ai", text: summary || result.reply.slice(0, 400) },
        ...(result.validation.ok
          ? []
          : [{ role: "ai" as const, text: `⚠ ${result.validation.errors.join("; ")}`, warn: true }]),
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "ai", text: `Couldn't do that: ${e instanceof Error ? e.message : "unknown error"}`, warn: true },
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
          <span className="text-sm font-medium text-ink">AI Agent</span>
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-ink">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-sm text-stone-400">
            <p>I can edit this workflow for you — add steps, wire branches, even create a new block.</p>
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
                : m.warn
                  ? "mr-6 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700"
                  : "mr-6 whitespace-pre-wrap rounded-xl rounded-bl-sm bg-stone-100 px-3 py-2 text-sm text-ink"
            }
          >
            {m.warn && <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
            {m.text}
          </div>
        ))}

        {loading && (
          <div className="mr-6 flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-500">
            <Loader2 className="size-4 animate-spin" /> Working on it…
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
            placeholder="Ask the agent to change this workflow…"
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
