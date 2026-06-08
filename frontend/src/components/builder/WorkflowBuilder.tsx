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
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { Trash2, Unlink, LassoSelect, Wand2 } from "lucide-react";
import { StepNode, type StepNodeType } from "./StepNode";
import { LabeledEdge } from "./LabeledEdge";
import { Palette } from "./Palette";
import type { Capability, Pathway } from "../../types";

const NODE_W = 224;
const NODE_H = 110;

// Run dagre to assign clean, minimal-crossing positions (the "Tidy" layout).
function layout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 90, nodesep: 70 });
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 } };
  });
}

// Translate a pathway (data) into React Flow nodes + edges (visuals).
function toFlow(pathway: Pathway): { nodes: StepNodeType[]; edges: Edge[] } {
  const nodes: StepNodeType[] = pathway.steps.map((s) => ({
    id: s.id,
    type: "step",
    position: { x: 0, y: 0 },
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
      data: { event },
      animated: true,
    })),
  );

  return { nodes, edges };
}

const nodeTypes = { step: StepNode };
const edgeTypes = { labeled: LabeledEdge };

function BuilderInner({ pathway, capabilities }: { pathway: Pathway; capabilities: Capability[] }) {
  const initial = useMemo(() => {
    const f = toFlow(pathway);
    return { nodes: layout(f.nodes, f.edges) as StepNodeType[], edges: f.edges };
  }, [pathway]);
  const [nodes, setNodes, onNodesChange] = useNodesState<StepNodeType>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges);
  const [lasso, setLasso] = useState(false);
  const [selCount, setSelCount] = useState(0);
  const { getNodes, getEdges, deleteElements, fitView } = useReactFlow();

  useEffect(() => {
    setNodes(initial.nodes);
    setEdges(initial.edges);
  }, [initial, setNodes, setEdges]);

  const onConnect = useCallback(
    (c: Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...c, type: "labeled", label: "patient replied", data: { event: "patient_replied" }, animated: true },
          eds,
        ),
      ),
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

  const tidy = useCallback(() => {
    setNodes((ns) => layout(ns, getEdges()) as StepNodeType[]);
    setTimeout(() => fitView({ duration: 400 }), 0);
  }, [setNodes, getEdges, fitView]);

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
              onClick={tidy}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-sm hover:bg-stone-50"
            >
              <Wand2 className="size-3.5" /> Tidy
            </button>
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
