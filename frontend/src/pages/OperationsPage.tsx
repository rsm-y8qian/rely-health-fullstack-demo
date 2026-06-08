import { useEffect, useMemo, useState } from "react";
import { UserPlus, Undo2 } from "lucide-react";
import { fetchPathways, fetchEnrollments, enrollPatient, sendPatientEvent, undoPatient } from "../api";
import type { Enrollment, EventType, Pathway } from "../types";
import { iconForAction } from "../components/icons";
import { useAppContext } from "../components/AppLayout";

const pretty = (s: string) => s.replace(/_/g, " ");

function PatientRow({
  enrollment,
  pathway,
  onEvent,
  onBack,
}: {
  enrollment: Enrollment;
  pathway: Pathway;
  onEvent: (id: string, event: EventType) => void;
  onBack: (id: string) => void;
}) {
  const step = pathway.steps.find((s) => s.id === enrollment.currentStepId);
  const Icon = iconForAction(step?.action ?? "complete");
  const events = step ? (Object.keys(step.transitions) as EventType[]) : [];
  const done = enrollment.status === "completed";
  const canGoBack = enrollment.history.length > 1;

  return (
    <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-ink-soft text-white">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="font-medium text-ink">{enrollment.patientName}</div>
          <div className="text-sm text-stone-500">
            {step?.name ?? "—"}
            <span className="ml-2 text-xs text-stone-400">step {enrollment.history.length}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Reverse the last advance */}
        <button
          onClick={() => onBack(enrollment.id)}
          disabled={!canGoBack}
          title="Go back one step"
          className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-500 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Undo2 className="size-3.5" /> Back
        </button>

        <span className="mx-1 text-stone-200">|</span>

        {done ? (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Completed
          </span>
        ) : events.length > 0 ? (
          events.map((ev) => (
            <button
              key={ev}
              onClick={() => onEvent(enrollment.id, ev)}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-fuchsia-300 hover:bg-fuchsia-50"
            >
              {pretty(ev)}
            </button>
          ))
        ) : (
          <span className="text-xs text-stone-400">no actions</span>
        )}
      </div>
    </div>
  );
}

export default function OperationsPage() {
  const { department } = useAppContext();
  const [pathway, setPathway] = useState<Pathway | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!department) return;
    fetchPathways(department).then((ps) => setPathway(ps[0] ?? null));
  }, [department]);

  useEffect(() => {
    if (!pathway) return;
    fetchEnrollments(pathway.id).then(setEnrollments);
  }, [pathway]);

  async function handleEvent(id: string, event: EventType) {
    const updated = await sendPatientEvent(id, event);
    setEnrollments((list) => list.map((e) => (e.id === id ? updated : e)));
  }

  async function handleBack(id: string) {
    const updated = await undoPatient(id);
    setEnrollments((list) => list.map((e) => (e.id === id ? updated : e)));
  }

  async function handleEnroll() {
    if (!newName.trim() || !pathway) return;
    const created = await enrollPatient(newName.trim(), pathway.id);
    setEnrollments((list) => [...list, created]);
    setNewName("");
  }

  const activeCount = useMemo(
    () => enrollments.filter((e) => e.status === "active").length,
    [enrollments],
  );

  if (!pathway) {
    return <div className="flex h-full items-center justify-center text-stone-400">Loading…</div>;
  }

  return (
    <div className="mx-auto h-full max-w-3xl overflow-y-auto px-6 py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">{pathway.name}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {department} · {activeCount} active · {enrollments.length} total
          </p>
        </div>
      </div>

      {/* Enroll a new patient */}
      <div className="mt-6 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleEnroll()}
          placeholder="New patient name…"
          className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-fuchsia-300"
        />
        <button
          onClick={handleEnroll}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink-soft px-4 py-2 text-sm font-medium text-white transition hover:bg-ink"
        >
          <UserPlus className="size-4" /> Enroll
        </button>
      </div>

      <div className="mt-4 space-y-2.5">
        {enrollments.map((e) => (
          <PatientRow key={e.id} enrollment={e} pathway={pathway} onEvent={handleEvent} onBack={handleBack} />
        ))}
      </div>
    </div>
  );
}
