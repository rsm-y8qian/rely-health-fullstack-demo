import { Handle, Position, useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { X, Clock, UserRound, Bot } from "lucide-react";
import { iconForAction, labelForAction } from "../icons";
import { formatWait } from "../../lib/format";
import type { ActionType } from "../../types";

export type StepNodeData = {
  name: string;
  action: ActionType;
  waitMinutes?: number;
  assignee?: string;
  isStart?: boolean;
  ports?: { id: string; x: number; y: number }[];
};
export type StepNodeType = Node<StepNodeData, "step">;

const handleClass = "!size-2 !border-0 !bg-stone-400 opacity-0 transition group-hover:opacity-100";

export function StepNode({ id, data, selected }: NodeProps<StepNodeType>) {
  const Icon = iconForAction(data.action);
  const { deleteElements } = useReactFlow();
  const wait = formatWait(data.waitMinutes);
  const isAi = data.assignee?.toLowerCase().includes("ai");

  // Handles at the positions ELK routed each edge to (so lines line up with the
  // routing), plus one spare on each side for drawing a new connection.
  const ports = data.ports ?? [];
  const srcSpare = `s${ports.filter((p) => p.id.startsWith("s")).length}`;
  const tgtSpare = `t${ports.filter((p) => p.id.startsWith("t")).length}`;

  return (
    <div
      className={`group relative w-64 cursor-pointer rounded-xl border bg-white p-3 shadow-sm transition ${
        selected ? "border-fuchsia-400 ring-2 ring-fuchsia-200" : "border-stone-200 hover:border-stone-300"
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteElements({ nodes: [{ id }] });
        }}
        title="Delete block"
        className="nodrag absolute -left-2.5 -top-2.5 flex size-5 scale-90 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow transition group-hover:scale-100 group-hover:opacity-100 hover:bg-red-700"
      >
        <X className="size-3" />
      </button>

      {ports
        .filter((p) => p.id.startsWith("t"))
        .map((p) => (
          <Handle key={p.id} id={p.id} type="target" position={Position.Top} style={{ left: p.x, top: 0 }} className={handleClass} />
        ))}
      <Handle id={tgtSpare} type="target" position={Position.Top} style={{ left: "50%" }} className={handleClass} />

      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-soft text-white">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          {/* Title (editable elsewhere) — wraps, never truncated */}
          <div className="text-sm font-medium leading-snug text-ink">{data.name}</div>
          {/* Human-readable task type */}
          <div className="mt-0.5 text-xs text-stone-400">{labelForAction(data.action)}</div>
        </div>
      </div>

      {(data.isStart || wait || data.assignee) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {data.isStart && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
              START
            </span>
          )}
          {wait && (
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500">
              <Clock className="size-2.5" /> {wait}
            </span>
          )}
          {data.assignee && (
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
              {isAi ? <Bot className="size-2.5" /> : <UserRound className="size-2.5" />}
              {data.assignee}
            </span>
          )}
        </div>
      )}

      {ports
        .filter((p) => p.id.startsWith("s"))
        .map((p) => (
          <Handle key={p.id} id={p.id} type="source" position={Position.Bottom} style={{ left: p.x, bottom: 0, top: "auto" }} className={handleClass} />
        ))}
      <Handle id={srcSpare} type="source" position={Position.Bottom} style={{ left: "50%" }} className={handleClass} />
    </div>
  );
}
