import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { fetchCapabilities, fetchPathways } from "../api";
import type { Capability, Pathway } from "../types";
import { WorkflowBuilder } from "../components/builder/WorkflowBuilder";
import { useAppContext } from "../components/AppLayout";

export default function BuilderPage() {
  const { department } = useAppContext();
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [pathway, setPathway] = useState<Pathway | null>(null);

  useEffect(() => {
    fetchCapabilities().then(setCapabilities);
  }, []);

  useEffect(() => {
    if (!department) return;
    setPathway(null);
    fetchPathways(department).then((ps) => setPathway(ps[0] ?? null));
  }, [department]);

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-hidden">
        {pathway && capabilities.length > 0 ? (
          <WorkflowBuilder pathway={pathway} capabilities={capabilities} />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">
            Loading workflow…
          </div>
        )}
      </div>

      <aside className="flex w-80 flex-col border-l border-stone-200 bg-white">
        <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-3">
          <Sparkles className="size-4 text-fuchsia-500" />
          <span className="text-sm font-medium text-ink">AI Assistant</span>
        </div>
        <div className="flex-1 p-4 text-sm text-stone-400">
          Describe the clinical workflow you need and I'll build it.
        </div>
        <div className="border-t border-stone-200 p-3">
          <div className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-400">
            e.g. “Follow up with discharged patients…” (Phase 3)
          </div>
        </div>
      </aside>
    </div>
  );
}
