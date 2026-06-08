import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowUp, Loader2, Plus, Copy, Workflow, Trash2, Pencil } from "lucide-react";
import {
  fetchPathways,
  generatePathwayAI,
  savePathway,
  createBlankPathway,
  duplicatePathway,
  deletePathway,
  updatePathwayMeta,
} from "../api";
import type { Pathway } from "../types";
import { summarize } from "../lib/summary";
import { formatRelativeTime } from "../lib/format";
import { useAppContext } from "../components/AppLayout";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EditMetaDialog } from "../components/EditMetaDialog";

const EXAMPLES = [
  "Diabetic patients: weekly blood-sugar check-in; call if no reply for 3 days.",
  "COPD: daily symptom text, escalate to a nurse on worsening, book a follow-up.",
];

export default function BuilderHome() {
  const { department } = useAppContext();
  const navigate = useNavigate();
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmTarget = pathways.find((p) => p.id === confirmId) ?? null;
  const [editId, setEditId] = useState<string | null>(null);
  const editTarget = pathways.find((p) => p.id === editId) ?? null;

  function reload() {
    if (department) fetchPathways(department).then(setPathways);
  }
  useEffect(reload, [department]);

  async function generate(text: string) {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setLoading(true);
    setError(null);
    try {
      const pathway = await generatePathwayAI(prompt, department);
      const saved = await savePathway(pathway);
      navigate(`/app/edit/${saved.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setLoading(false);
    }
  }

  async function newBlank() {
    const p = await createBlankPathway(department);
    navigate(`/app/edit/${p.id}`);
  }

  async function duplicate(id: string) {
    await duplicatePathway(id);
    reload();
  }

  async function remove(id: string) {
    await deletePathway(id);
    setConfirmId(null);
    reload();
  }

  async function saveMeta(id: string, meta: { name: string; description: string }) {
    await updatePathwayMeta(id, meta);
    setEditId(null);
    reload();
  }

  return (
    <div className="relative h-full overflow-y-auto bg-cream">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Welcome */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-medium text-stone-600 shadow-sm">
            <Sparkles className="size-3.5 text-fuchsia-500" /> {department} · Rely Builder
          </span>
          <h1 className="mt-5 font-display text-4xl font-medium text-ink sm:text-5xl">
            Welcome to Rely Builder
          </h1>
          <p className="mx-auto mt-3 max-w-md text-stone-500">
            Describe a clinical workflow and AI will build it — or open one of your existing
            workflows below.
          </p>
        </div>

        {/* Big AI box */}
        <div className="mt-8">
          <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm focus-within:border-fuchsia-300">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  generate(input);
                }
              }}
              rows={3}
              placeholder="e.g. New mothers: wellness check 3 days after delivery, escalate if they feel down…"
              className="w-full resize-none px-2 py-1 text-sm outline-none placeholder:text-stone-400"
            />
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => generate(ex)}
                    className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] text-stone-500 transition hover:border-fuchsia-300 hover:bg-fuchsia-50/40"
                  >
                    {ex.split(":")[0]}
                  </button>
                ))}
              </div>
              <button
                onClick={() => generate(input)}
                disabled={loading || !input.trim()}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-soft text-white transition hover:bg-ink disabled:opacity-40"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
              </button>
            </div>
          </div>
          {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
        </div>

        {/* Workflow cards */}
        <div className="mt-12">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-stone-400">
            {department} workflows
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {pathways.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ y: -3 }}
                onClick={() => navigate(`/app/edit/${p.id}`)}
                role="button"
                tabIndex={0}
                className="group relative cursor-pointer rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:shadow-lg"
              >
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditId(p.id);
                    }}
                    title="Edit details"
                    className="flex size-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-ink"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicate(p.id);
                    }}
                    title="Duplicate"
                    className="flex size-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-ink"
                  >
                    <Copy className="size-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmId(p.id);
                    }}
                    title="Delete"
                    className="flex size-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-ink-soft text-white">
                  <Workflow className="size-5" />
                </div>
                <div className="mt-3 font-display text-lg font-medium text-ink">{p.name}</div>
                <div className="mt-1 text-sm text-stone-500">{p.description || summarize(p)}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
                  <span>{p.steps.length} steps</span>
                  <span>{formatRelativeTime(p.updatedAt)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* + Create new workflow */}
      <motion.button
        onClick={newBlank}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="New workflow"
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-ink-soft text-white shadow-lg transition hover:bg-ink"
      >
        <Plus className="size-6" />
      </motion.button>

      <AnimatePresence>
        {confirmTarget && (
          <ConfirmDialog
            title="Delete workflow?"
            message={`“${confirmTarget.name}” will be permanently removed. This can't be undone.`}
            onConfirm={() => remove(confirmTarget.id)}
            onCancel={() => setConfirmId(null)}
          />
        )}
        {editTarget && (
          <EditMetaDialog
            initialName={editTarget.name}
            initialDescription={editTarget.description}
            onSave={(meta) => saveMeta(editTarget.id, meta)}
            onCancel={() => setEditId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
