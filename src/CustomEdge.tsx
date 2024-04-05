import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  getSimpleBezierPath,
  getStraightPath,
} from "reactflow";
import { MyEdge } from "./dataMapper";
import { Address, formatEther } from "viem";
import { useMemo } from "react";
import { memoize } from "lodash";
import { FastAverageColor } from "fast-average-color";
import { extendedSuperTokenList } from "@superfluid-finance/tokenlist";
import { useQuery } from "@tanstack/react-query";

const fac = new FastAverageColor();

const getTokenAverageColor = memoize((tokenAddress: Address) => {
  console.log("foo");
  const addressLowerCased = tokenAddress.toLowerCase();
  const tokenListEntry = extendedSuperTokenList.tokens.find(
    (x) => x.address.toLowerCase() === addressLowerCased,
  );
  if (tokenListEntry && tokenListEntry.logoURI) {
    return fac.getColorAsync(tokenListEntry.logoURI);
  }
});

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

  const { data: tokenColor } = useQuery({
    queryKey: ["tokenAverageColor", token.id],
    queryFn: () => getTokenAverageColor(token.id as Address),
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          strokeWidth: 4,
          stroke: tokenColor ? tokenColor.rgb : undefined,
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
