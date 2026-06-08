import { useEffect, useState } from "react";
import { fetchCapabilities, fetchPathways } from "../api";
import type { Capability, Pathway } from "../types";
import { WorkflowBuilder } from "../components/builder/WorkflowBuilder";
import { AiAssistant } from "../components/builder/AiAssistant";
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

      <AiAssistant department={department} onPathway={setPathway} />
    </div>
  );
}
