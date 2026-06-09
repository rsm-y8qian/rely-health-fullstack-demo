import { useCallback, useEffect, useState } from "react";
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
import ELK from "elkjs/lib/elk.bundled.js";
import { Trash2, Unlink, LassoSelect, Wand2, Undo2 } from "lucide-react";
import { StepNode, type StepNodeType, type StepNodeData } from "./StepNode";
import { LabeledEdge } from "./LabeledEdge";
import { Palette } from "./Palette";
import { NodeDetailPanel } from "./NodeDetailPanel";
import type { Capability, Pathway } from "../../types";

const NODE_W = 224;
const NODE_H = 110;
const elk = new ELK();

// ELK layered layout — GREEDY cycle-breaking + BRANDES_KOEPF placement give a
// centered spine with clean side branches, even with back-edges (the "Tidy").
async function layout(nodes: Node[], edges: Edge[]): Promise<Node[]> {
  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.layered.cycleBreaking.strategy": "GREEDY",
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.layered.spacing.nodeNodeBetweenLayers": "90",
      "elk.spacing.nodeNode": "70",
    },
    children: nodes.map((n) => ({ id: n.id, width: NODE_W, height: NODE_H })),
    edges: edges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  };
  const laidOut = await elk.layout(graph);
  const pos = new Map((laidOut.children ?? []).map((c) => [c.id, { x: c.x ?? 0, y: c.y ?? 0 }]));
  return nodes.map((n) => ({ ...n, position: pos.get(n.id) ?? n.position }));
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

  // Give every edge its own source/target handle so each transition runs in its
  // own column — no overlap. Nodes render one handle per connection + a spare.
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
        sourceHandle: `s${oi}`,
        targetHandle: `t${ii}`,
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
  const [nodes, setNodes, onNodesChange] = useNodesState<StepNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
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

  // On pathway load: build nodes/edges, then run the async ELK layout.
  useEffect(() => {
    let cancelled = false;
    const f = toFlow(pathway);
    setEdges(f.edges);
    setPast([]);
    layout(f.nodes, f.edges).then((laid) => {
      if (cancelled) return;
      setNodes(laid as StepNodeType[]);
      setTimeout(() => fitView({ duration: 300 }), 0);
    });
    return () => {
      cancelled = true;
    };
  }, [pathway, setNodes, setEdges, fitView]);

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

  const tidy = useCallback(async () => {
    takeSnapshot();
    const laid = await layout(getNodes(), getEdges());
    setNodes(laid as StepNodeType[]);
    setTimeout(() => fitView({ duration: 400 }), 0);
  }, [setNodes, getNodes, getEdges, fitView, takeSnapshot]);

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
