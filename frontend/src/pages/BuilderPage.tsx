import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { fetchCapabilities, fetchPathway } from "../api";
import type { Capability, Pathway } from "../types";
import { WorkflowBuilder } from "../components/builder/WorkflowBuilder";
import { AiOrb } from "../components/builder/AiOrb";

export default function BuilderPage() {
  const { id } = useParams();
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [pathway, setPathway] = useState<Pathway | null>(null);

  useEffect(() => {
    fetchCapabilities().then(setCapabilities);
  }, []);

  useEffect(() => {
    if (!id) return;
    setPathway(null);
    fetchPathway(id).then(setPathway).catch(() => setPathway(null));
  }, [id]);

  return (
    <div className="relative h-full overflow-hidden">
      {/* Back to the workflow list */}
      <Link
        to="/app"
        className="absolute left-[15rem] top-3 z-30 flex items-center gap-1 rounded-lg border border-stone-200 bg-white/90 px-3 py-1.5 text-sm text-stone-600 shadow-sm backdrop-blur hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Workflows
      </Link>

      {pathway && capabilities.length > 0 ? (
        <WorkflowBuilder pathway={pathway} capabilities={capabilities} />
      ) : (
        <div className="flex h-full items-center justify-center text-stone-400">
          Loading workflow…
        </div>
      )}

      <AiOrb department={pathway?.department ?? ""} onPathway={setPathway} />
    </div>
  );
}
