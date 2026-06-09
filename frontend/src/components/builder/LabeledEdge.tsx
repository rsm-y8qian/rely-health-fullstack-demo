import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { EVENT_OPTIONS, type EventType } from "../../types";

const pretty = (s: string) => s.replace(/_/g, " ");

type Pt = { x: number; y: number };

// Build a rounded orthogonal SVG path from ELK's bend points, and find the
// midpoint (by length) so the label sits in the routing channel, off the nodes.
function pathFromPoints(points: Pt[], r = 8): { d: string; mid: Pt } {
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    const v1 = norm(cur, prev, r);
    const v2 = norm(cur, next, r);
    d += ` L ${v1.x},${v1.y} Q ${cur.x},${cur.y} ${v2.x},${v2.y}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x},${last.y}`;

  let total = 0;
  const segs: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const len = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    segs.push(len);
    total += len;
  }
  let half = total / 2;
  let mid = points[0];
  for (let i = 1; i < points.length; i++) {
    const len = segs[i - 1];
    if (half <= len) {
      const t = len ? half / len : 0;
      mid = { x: points[i - 1].x + (points[i].x - points[i - 1].x) * t, y: points[i - 1].y + (points[i].y - points[i - 1].y) * t };
      break;
    }
    half -= len;
  }
  return { d, mid };
}

function norm(from: Pt, to: Pt, r: number): Pt {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const k = Math.min(r, len / 2) / len;
  return { x: from.x + dx * k, y: from.y + dy * k };
}

// A transition edge. Its label is the event that triggers the transition —
// editable via a dropdown of valid events (free text would break the engine).
export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  // Prefer ELK's routed polyline; fall back to smoothstep for freshly-drawn edges.
  const points = (data?.points as Pt[] | undefined) ?? [];
  let path: string;
  let labelX: number;
  let labelY: number;
  if (points.length >= 2) {
    const { d, mid } = pathFromPoints(points);
    path = d;
    labelX = mid.x;
    labelY = mid.y;
  } else {
    [path, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 10,
    });
  }
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
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
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
