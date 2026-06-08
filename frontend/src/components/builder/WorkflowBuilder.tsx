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
import { AnimatePresence } from "motion/react";
import dagre from "dagre";
import { Trash2, Unlink, LassoSelect, Wand2, Undo2 } from "lucide-react";
import { StepNode, type StepNodeType, type StepNodeData } from "./StepNode";
import { LabeledEdge } from "./LabeledEdge";
import { Palette } from "./Palette";
import { NodeDetailPanel } from "./NodeDetailPanel";
import type { Capability, Pathway } from "../../types";

const NODE_W = 224;
const NODE_H = 110;

// Run dagre to assign clean, minimal-crossing positions (the "Tidy" layout).
function layout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  // Generous spacing + reserve space for each edge's label so labels don't
  // land on top of nodes.
  g.setGraph({ rankdir: "TB", ranksep: 120, nodesep: 110, edgesep: 40 });
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target, { width: 90, height: 24, labelpos: "c" }));
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
      waitMinutes: s.waitHours != null ? s.waitHours * 60 : undefined,
      isStart: s.id === pathway.startStepId,
    },
  }));

  // Spread parallel edges across 3 source/target handles so vertical runs
  // don't stack on top of each other (keeps the flow direction legible).
  const outCount = new Map<string, number>();
  const inCount = new Map<string, number>();
  for (const s of pathway.steps) {
    for (const to of Object.values(s.transitions)) {
      outCount.set(s.id, (outCount.get(s.id) ?? 0) + 1);
      inCount.set(to, (inCount.get(to) ?? 0) + 1);
    }
  }
  const slot = (i: number, n: number) => (n <= 1 ? 1 : n === 2 ? (i === 0 ? 0 : 2) : i % 3);
  const outIdx = new Map<string, number>();
  const inIdx = new Map<string, number>();

  const edges: Edge[] = pathway.steps.flatMap((s) =>
    Object.entries(s.transitions).map(([event, to]) => {
      const oi = outIdx.get(s.id) ?? 0;
      outIdx.set(s.id, oi + 1);
      const ii = inIdx.get(to) ?? 0;
      inIdx.set(to, ii + 1);
      return {
        id: `${s.id}-${event}-${to}`,
        source: s.id,
        target: to,
        sourceHandle: `s${slot(oi, outCount.get(s.id) ?? 1)}`,
        targetHandle: `t${slot(ii, inCount.get(to) ?? 1)}`,
        type: "labeled",
        label: event.replace(/_/g, " "),
        data: { event },
        animated: true,
      };
    }),
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const { getNodes, getEdges, deleteElements, fitView } = useReactFlow();

  // Undo history: snapshot the canvas before each change; Undo restores it.
  const [past, setPast] = useState<{ nodes: StepNodeType[]; edges: Edge[] }[]>([]);
  const takeSnapshot = useCallback(() => {
    setPast((p) => [
      ...p.slice(-50),
      { nodes: structuredClone(getNodes()) as StepNodeType[], edges: structuredClone(getEdges()) as Edge[] },
    ]);
  }, [getNodes, getEdges]);
  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      return p.slice(0, -1);
    });
  }, [setNodes, setEdges]);

  const editingNode = nodes.find((n) => n.id === editingId) ?? null;

  const saveNode = useCallback(
    (next: StepNodeData) => {
      takeSnapshot();
      setNodes((ns) => ns.map((n) => (n.id === editingId ? { ...n, data: next } : n)));
      setEditingId(null);
    },
    [editingId, setNodes, takeSnapshot],
  );

  useEffect(() => {
    setNodes(initial.nodes);
    setEdges(initial.edges);
    setPast([]);
  }, [initial, setNodes, setEdges]);

  const onConnect = useCallback(
    (c: Connection) => {
      takeSnapshot();
      setEdges((eds) =>
        addEdge(
          { ...c, type: "labeled", label: "patient replied", data: { event: "patient_replied" }, animated: true },
          eds,
        ),
      );
    },
    [setEdges, takeSnapshot],
  );

  const addStep = useCallback(
    (cap: Capability) => {
      takeSnapshot();
      const id = `step-${Date.now()}`;
      setNodes((ns) => [
        ...ns,
        { id, type: "step", position: { x: 380, y: 60 }, data: { name: cap.label, action: cap.action } },
      ]);
    },
    [setNodes, takeSnapshot],
  );

  const tidy = useCallback(() => {
    takeSnapshot();
    setNodes((ns) => layout(ns, getEdges()) as StepNodeType[]);
    setTimeout(() => fitView({ duration: 400 }), 0);
  }, [setNodes, getEdges, fitView, takeSnapshot]);

  const deleteSelected = useCallback(() => {
    deleteElements({
      nodes: getNodes().filter((n) => n.selected),
      edges: getEdges().filter((e) => e.selected),
    });
  }, [deleteElements, getNodes, getEdges]);

  return (
    <div className="relative flex h-full">
      <Palette capabilities={capabilities} onAdd={addStep} />
      <div className="h-full flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setEditingId(node.id)}
          onNodeDragStart={() => takeSnapshot()}
          onBeforeDelete={async () => {
            takeSnapshot();
            return true;
          }}
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
            <button
              onClick={undo}
              disabled={past.length === 0}
              title="Undo"
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Undo2 className="size-3.5" /> Undo
            </button>
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
              onClick={() => {
                takeSnapshot();
                setEdges([]);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:bg-stone-50"
            >
              <Unlink className="size-3.5" /> Clear links
            </button>
            <button
              onClick={() => {
                takeSnapshot();
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

      <AnimatePresence>
        {editingNode && (
          <NodeDetailPanel
            data={editingNode.data}
            capabilities={capabilities}
            onSave={saveNode}
            onClose={() => setEditingId(null)}
          />
        )}
      </AnimatePresence>
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
