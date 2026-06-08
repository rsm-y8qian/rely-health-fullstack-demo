import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";

// A transition edge whose label is a readable pill (white bg masks crossing
// lines) with a delete button on hover.
export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
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
  const { deleteElements } = useReactFlow();

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke: "#a8a29e" }} />
      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan group/edge absolute flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600 shadow-sm"
        >
          {label}
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
