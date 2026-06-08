import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { EVENT_OPTIONS, type EventType } from "../../types";

const pretty = (s: string) => s.replace(/_/g, " ");

// A transition edge. Its label is the event that triggers the transition —
// editable via a dropdown of valid events (free text would break the engine).
export function LabeledEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  // Nudge the label perpendicular by direction so two opposite edges between the
  // same pair of nodes don't stack their labels on top of each other.
  const offsetY = source < target ? -11 : 11;
  const { deleteElements, setEdges } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const event = (data?.event as EventType) ?? "patient_replied";

  function setEvent(next: EventType) {
    setEdges((eds) =>
      eds.map((e) => (e.id === id ? { ...e, label: pretty(next), data: { ...e.data, event: next } } : e)),
    );
    setEditing(false);
  }

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke: "#a8a29e" }} />
      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + offsetY}px)`,
            pointerEvents: "all",
            zIndex: 1000,
          }}
          className="nodrag nopan group/edge absolute flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600 shadow-sm"
        >
          {editing ? (
            <select
              autoFocus
              value={event}
              onChange={(e) => setEvent(e.target.value as EventType)}
              onBlur={() => setEditing(false)}
              className="bg-white text-[10px] outline-none"
            >
              {EVENT_OPTIONS.map((ev) => (
                <option key={ev} value={ev}>
                  {pretty(ev)}
                </option>
              ))}
            </select>
          ) : (
            <button onClick={() => setEditing(true)} title="Click to change event">
              {pretty(event)}
            </button>
          )}
          <button
            onClick={() => deleteElements({ edges: [{ id }] })}
            title="Delete connection"
            className="flex size-3.5 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition group-hover/edge:opacity-100 hover:bg-red-700"
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
