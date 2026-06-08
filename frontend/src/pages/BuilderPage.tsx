import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { fetchCapabilities, fetchPathway, deletePathway } from "../api";
import type { Capability, Pathway } from "../types";
import { WorkflowBuilder } from "../components/builder/WorkflowBuilder";
import { AiOrb } from "../components/builder/AiOrb";
import { ConfirmDialog } from "../components/ConfirmDialog";

export default function BuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [pathway, setPathway] = useState<Pathway | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

      <AiOrb department={pathway?.department ?? ""} onPathway={setPathway} />

      <AnimatePresence>
        {confirmDelete && pathway && (
          <ConfirmDialog
            title="Delete workflow?"
            message={`“${pathway.name}” will be permanently removed. This can't be undone.`}
            onConfirm={remove}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
