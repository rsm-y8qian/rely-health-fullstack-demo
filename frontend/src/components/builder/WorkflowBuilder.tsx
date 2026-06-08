import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { StepNode, type StepNodeType } from "./StepNode";
import { Palette } from "./Palette";
import type { Capability, Pathway } from "../../types";

// Translate a pathway (data) into React Flow nodes + edges (visuals).
function toFlow(pathway: Pathway): { nodes: StepNodeType[]; edges: Edge[] } {
  const nodes: StepNodeType[] = pathway.steps.map((s, i) => ({
    id: s.id,
    type: "step",
    position: { x: 80 + (i % 2) * 300, y: 30 + i * 140 },
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
      label: event.replace(/_/g, " "),
      animated: true,
      style: { stroke: "#a8a29e" },
    })),
  );

  return { nodes, edges };
}

const nodeTypes = { step: StepNode };

export function WorkflowBuilder({
  pathway,
  capabilities,
}: {
  pathway: Pathway;
  capabilities: Capability[];
}) {
  const initial = useMemo(() => toFlow(pathway), [pathway]);
  const [nodes, setNodes, onNodesChange] = useNodesState<StepNodeType>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges);

  // When the loaded pathway changes (e.g. switch department), reload the canvas.
  useEffect(() => {
    const f = toFlow(pathway);
    setNodes(f.nodes);
    setEdges(f.edges);
  }, [pathway, setNodes, setEdges]);

  // Dragging from one node's handle to another creates a new transition.
  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge({ ...c, animated: true, style: { stroke: "#a8a29e" } }, eds)),
    [setEdges],
  );

  // Clicking a palette block drops a new step onto the canvas.
  const addStep = useCallback(
    (cap: Capability) => {
      const id = `step-${Date.now()}`;
      setNodes((ns) => [
        ...ns,
        {
          id,
          type: "step",
          position: { x: 360, y: 60 },
          data: { name: cap.label, action: cap.action },
        },
      ]);
    },
    [setNodes],
  );

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
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e7e5e4" gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
