import { Handle, Position, useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { X } from "lucide-react";
import { iconForAction } from "../icons";
import type { ActionType } from "../../types";

export type StepNodeData = {
  name: string;
  action: ActionType;
  waitHours?: number;
  isStart?: boolean;
};
export type StepNodeType = Node<StepNodeData, "step">;

export function StepNode({ id, data, selected }: NodeProps<StepNodeType>) {
  const Icon = iconForAction(data.action);
  const { deleteElements } = useReactFlow();

  return (
    <div
      className={`group relative w-56 rounded-xl border bg-white p-3 shadow-sm transition ${
        selected ? "border-fuchsia-400 ring-2 ring-fuchsia-200" : "border-stone-200"
      }`}
    >
      {/* Delete button — appears on hover (top-left, red) */}
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

      <Handle type="target" position={Position.Top} className="!size-2 !bg-stone-400" />

      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-soft text-white">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-ink">{data.name}</div>
          <div className="truncate text-xs text-stone-400">{data.action}</div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {data.isStart && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
            START
          </span>
        )}
        {data.waitHours ? (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500">
            waits {data.waitHours}h
          </span>
        ) : null}
      </div>

      <Handle type="source" position={Position.Bottom} className="!size-2 !bg-stone-400" />
    </div>
  );
}
