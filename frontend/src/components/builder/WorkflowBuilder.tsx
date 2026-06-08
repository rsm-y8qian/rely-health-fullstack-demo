import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Panel,
  addEdge,
  useReactFlow,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Trash2, Unlink, LassoSelect } from "lucide-react";
import { StepNode, type StepNodeType } from "./StepNode";
import { LabeledEdge } from "./LabeledEdge";
import { Palette } from "./Palette";
import type { Capability, Pathway } from "../../types";

// Assign each step a "level" = its distance from the start (BFS), so we can lay
// the graph out top-to-bottom with branches spread side-by-side.
function computeLevels(pathway: Pathway): Map<string, number> {
  const level = new Map<string, number>([[pathway.startStepId, 0]]);
  const queue = [pathway.startStepId];
  while (queue.length) {
    const id = queue.shift()!;
    const step = pathway.steps.find((s) => s.id === id);
    if (!step) continue;
    for (const to of Object.values(step.transitions)) {
      if (!level.has(to)) {
        level.set(to, (level.get(id) ?? 0) + 1);
        queue.push(to);
      }
    }
  }
  pathway.steps.forEach((s) => { if (!level.has(s.id)) level.set(s.id, 0); });
  return level;
}

// Translate a pathway (data) into React Flow nodes + edges (visuals).
function toFlow(pathway: Pathway): { nodes: StepNodeType[]; edges: Edge[] } {
  const level = computeLevels(pathway);
  const byLevel = new Map<number, string[]>();
  pathway.steps.forEach((s) => {
    const l = level.get(s.id)!;
    if (!byLevel.has(l)) byLevel.set(l, []);
    byLevel.get(l)!.push(s.id);
  });

  const posById = new Map<string, { x: number; y: number }>();
  byLevel.forEach((ids, l) => {
    ids.forEach((id, i) => {
      const x = 120 + (i - (ids.length - 1) / 2) * 340 + 260;
      posById.set(id, { x, y: 40 + l * 180 });
    });
  });

  const nodes: StepNodeType[] = pathway.steps.map((s) => ({
    id: s.id,
    type: "step",
    position: posById.get(s.id)!,
    data: {
      name: s.name,
      action: s.action,
      waitHours: s.waitHours,
      isStart: s.id === pathway.startStepId,
    },
  }));

  const edges: Edge[] = pathway.steps.flatMap((s) =>
    Object.entries(s.transitions).map(([event, to]) => ({
      id: `${s.id}-${event}-${to}`,
      source: s.id,
      target: to,
      type: "labeled",
      label: event.replace(/_/g, " "),
      animated: true,
    })),
  );

  return { nodes, edges };
}

const nodeTypes = { step: StepNode };
const edgeTypes = { labeled: LabeledEdge };

function BuilderInner({ pathway, capabilities }: { pathway: Pathway; capabilities: Capability[] }) {
  const initial = useMemo(() => toFlow(pathway), [pathway]);
  const [nodes, setNodes, onNodesChange] = useNodesState<StepNodeType>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges);
  const [lasso, setLasso] = useState(false);
  const [selCount, setSelCount] = useState(0);
  const { getNodes, getEdges, deleteElements } = useReactFlow();

  useEffect(() => {
    const f = toFlow(pathway);
    setNodes(f.nodes);
    setEdges(f.edges);
  }, [pathway, setNodes, setEdges]);

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge({ ...c, type: "labeled", label: "event", animated: true }, eds)),
    [setEdges],
  );

  const addStep = useCallback(
    (cap: Capability) => {
      const id = `step-${Date.now()}`;
      setNodes((ns) => [
        ...ns,
        { id, type: "step", position: { x: 380, y: 60 }, data: { name: cap.label, action: cap.action } },
      ]);
    },
    [setNodes],
  );

  const deleteSelected = useCallback(() => {
    deleteElements({
      nodes: getNodes().filter((n) => n.selected),
      edges: getEdges().filter((e) => e.selected),
    });
  }, [deleteElements, getNodes, getEdges]);

  return (
    <div className="flex h-full">
      <Palette capabilities={capabilities} onAdd={addStep} />
      <div className="h-full flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={({ nodes: n, edges: e }) => setSelCount(n.length + e.length)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={["Delete", "Backspace"]}
          selectionOnDrag={lasso}
          panOnDrag={!lasso}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e7e5e4" gap={20} />
          <Controls showInteractive={false} />

          {/* Delete toolbar */}
          <Panel position="top-right" className="flex gap-2">
            {selCount > 0 && (
              <button
                onClick={deleteSelected}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700"
              >
                <Trash2 className="size-3.5" /> Delete selected ({selCount})
              </button>
            )}
            <button
              onClick={() => setLasso((v) => !v)}
              title="Drag a box to select, then delete"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm ${
                lasso ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              <LassoSelect className="size-3.5" /> Lasso
            </button>
            <button
              onClick={() => setEdges([])}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:bg-stone-50"
            >
              <Unlink className="size-3.5" /> Clear links
            </button>
            <button
              onClick={() => {
                setNodes([]);
                setEdges([]);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:bg-stone-50"
            >
              <Trash2 className="size-3.5" /> Clear all
            </button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export function WorkflowBuilder(props: { pathway: Pathway; capabilities: Capability[] }) {
  return (
    <ReactFlowProvider>
      <BuilderInner {...props} />
    </ReactFlowProvider>
  );
}
