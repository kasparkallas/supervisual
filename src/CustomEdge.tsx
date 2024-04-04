import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getStraightPath,
} from "reactflow";
import { MyEdge } from "./dataMapper";
import { formatEther } from "viem";

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const { flowRate } = (data as MyEdge["data"]) ?? { flowRate: 0n };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          strokeWidth: 3,
        }}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              padding: 10,
              borderRadius: 5,
              borderColor: "black",
              borderWidth: 1,
              fontSize: 12,
              fontWeight: 700,
            }}
            className="nodrag nopan bg-neutral-50"
          >
            {formatEther(flowRate)}/sec
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
