import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  getSimpleBezierPath,
  getStraightPath,
} from "reactflow";
import { MyEdge } from "./dataMapper";
import { formatEther } from "viem";
import { useMemo } from "react";

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
  data,
}: EdgeProps<MyEdge["data"]>) {
  const [edgePath, labelX, labelY] = getSimpleBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const { token, flowRate } = data!; // todo: bang

  const flowRatePerDayString = useMemo(() => {
    const flowRatePerDay = flowRate * 86400n;
    return `${formatEther(flowRatePerDay)} ${token.symbol}/day`;
  }, [flowRate, token]);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          strokeWidth: 4,
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
            {flowRatePerDayString}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
