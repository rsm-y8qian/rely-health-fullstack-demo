import { useEffect, useState } from "react";
import { Heart, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchDepartments, fetchCapabilities, fetchPathways } from "../api";
import type { Capability, Pathway } from "../types";
import { WorkflowBuilder } from "../components/builder/WorkflowBuilder";

export default function BuilderPage() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [department, setDepartment] = useState<string>("");
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [pathway, setPathway] = useState<Pathway | null>(null);

  // On mount: load the department list + the block catalog.
  useEffect(() => {
    fetchDepartments().then((d) => {
      setDepartments(d);
      setDepartment(d[0] ?? "");
    });
    fetchCapabilities().then(setCapabilities);
  }, []);

  // When the selected department changes: load that department's pathway.
  useEffect(() => {
    if (!department) return;
    setPathway(null);
    fetchPathways(department).then((ps) => setPathway(ps[0] ?? null));
  }, [department]);

  return (
    <div className="flex h-screen flex-col bg-stone-50">
      {/* App top bar */}
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center text-xl font-bold tracking-tight text-ink">
            rely
            <Heart className="ml-0.5 size-3.5 translate-y-1 fill-fuchsia-500 text-fuchsia-500" />
          </Link>
          <span className="text-stone-300">/</span>
          <span className="text-sm font-medium text-stone-600">Workflow Builder</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-700">
            <span className="size-2 rounded-full bg-green-500" />
            Mercy General Hospital
          </div>
          {/* Department (service line) switcher — the lightweight tenancy layer */}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <Link to="/" className="flex items-center gap-1 text-sm text-stone-500 hover:text-ink">
            <ArrowLeft className="size-4" /> Site
          </Link>
        </div>
      </header>

      {/* Body: builder (canvas + palette) on the left, AI assistant on the right */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          {pathway && capabilities.length > 0 ? (
            <WorkflowBuilder pathway={pathway} capabilities={capabilities} />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              Loading workflow…
            </div>
          )}
        </main>

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
    </div>
  );
}
