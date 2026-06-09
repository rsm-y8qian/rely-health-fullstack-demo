import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
import { fetchCapabilities, fetchPathway, deletePathway, updatePathwayMeta } from "../api";
import type { Capability, Pathway } from "../types";
import { WorkflowBuilder } from "../components/builder/WorkflowBuilder";
import { AiOrb } from "../components/builder/AiOrb";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EditMetaDialog } from "../components/EditMetaDialog";

export default function BuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [pathway, setPathway] = useState<Pathway | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMeta, setShowMeta] = useState(false);

  useEffect(() => {
    fetchCapabilities().then(setCapabilities);
  }, []);

  useEffect(() => {
    if (!id) return;
    setPathway(null);
    fetchPathway(id).then(setPathway).catch(() => setPathway(null));
  }, [id]);

  async function remove() {
    if (id) await deletePathway(id);
    navigate("/app");
  }

  // After the agent edits the pathway, apply it and refresh the block palette
  // (the agent may have created a new capability).
  function applyAgentPathway(p: Pathway) {
    setPathway(p);
    fetchCapabilities().then(setCapabilities);
  }

  async function saveMeta(meta: { name: string; description: string }) {
    if (id) {
      const updated = await updatePathwayMeta(id, meta);
      setPathway(updated);
    }
    setShowMeta(false);
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* Top-left controls over the canvas */}
      <div className="absolute left-[15rem] top-3 z-30 flex gap-2">
        <Link
          to="/app"
          className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white/90 px-3 py-1.5 text-sm text-stone-600 shadow-sm backdrop-blur hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Workflows
        </Link>
        {pathway && (
          <button
            onClick={() => setShowMeta(true)}
            title="Rename workflow"
            className="group/name flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white/90 px-3 py-1.5 text-sm font-medium text-ink shadow-sm backdrop-blur hover:bg-stone-50"
          >
            {pathway.name}
            <Pencil className="size-3.5 text-stone-400 opacity-0 transition group-hover/name:opacity-100" />
          </button>
        )}
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white/90 px-3 py-1.5 text-sm text-stone-600 shadow-sm backdrop-blur hover:border-red-300 hover:text-red-600"
        >
          <Trash2 className="size-4" /> Delete
        </button>
      </div>

      {pathway && capabilities.length > 0 ? (
        <WorkflowBuilder pathway={pathway} capabilities={capabilities} />
      ) : (
        <div className="flex h-full items-center justify-center text-stone-400">
          Loading workflow…
        </div>
      )}

      <AiOrb pathway={pathway} onPathway={applyAgentPathway} />

      <AnimatePresence>
        {confirmDelete && pathway && (
          <ConfirmDialog
            title="Delete workflow?"
            message={`“${pathway.name}” will be permanently removed. This can't be undone.`}
            onConfirm={remove}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
        {showMeta && pathway && (
          <EditMetaDialog
            initialName={pathway.name}
            initialDescription={pathway.description}
            onSave={saveMeta}
            onCancel={() => setShowMeta(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
