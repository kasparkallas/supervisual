import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { MyNode } from "./dataMapper";
import { cn } from "./lib/utils";

function CustomNode({ data }: MyNode) {
  return (
    <div
      className={cn(
        "rounded-md border-2 border-stone-600 px-4 py-2 shadow-md",
        data.isPool ? "bg-amber-100" : "bg-white",
      )}
    >
      <div className="flex">
        <div className="ml-2">
          <div
            className={cn(
              "font-mono text-lg",
              data.isSelected ? "font-extrabold" : "",
            )}
            title={data?.address}
          >
            {data?.label}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(CustomNode);
