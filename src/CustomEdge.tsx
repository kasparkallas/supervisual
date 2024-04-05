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
import Tinycolor2 from "tinycolor2";

const fastAverageColor = new FastAverageColor();

const getTokenListEntry = memoize((tokenAddress: Address) => {
  const addressLowerCased = tokenAddress.toLowerCase();
  return extendedSuperTokenList.tokens.find(
    (x) => x.address.toLowerCase() === addressLowerCased,
  );
});

const getTokenAverageColor = memoize(async (tokenAddress: Address) => {
  const tokenListEntry = getTokenListEntry(tokenAddress);

  if (tokenListEntry && tokenListEntry.logoURI) {
    const color = await fastAverageColor.getColorAsync(tokenListEntry.logoURI);
    const tinycolor = new Tinycolor2(color.hexa);

    if (tinycolor.isLight()) {
      return tinycolor.desaturate(10).toHexString();
    } else {
      return tinycolor.lighten(5).toHexString();
    }
  }
});

// this is used for straight edges and simple smoothstep edges (LTR, RTL, BTT, TTB)
export function getEdgeCenter({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): [number, number, number, number] {
  const xOffset = Math.abs(targetX - sourceX) / 2;
  const centerX = targetX < sourceX ? targetX + xOffset : targetX - xOffset;

  const yOffset = Math.abs(targetY - sourceY) / 2;
  const centerY = targetY < sourceY ? targetY + yOffset : targetY - yOffset;

  return [centerX, centerY, xOffset, yOffset];
}

export function getCurvedPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  something,
}: Parameters<typeof getStraightPath>[0] & {
  something?: {
    length: number;
    index: number;
  };
}): [
  path: string,
  labelX: number,
  labelY: number,
  offsetX: number,
  offsetY: number,
] {
  const [labelX, labelY, offsetX, offsetY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  let incrementor = 0;
  if (something && something.length > 1) {
    if (something.index % 2 === 0) {
      incrementor = (something.index + 1) * 15;
    } else {
      incrementor = something.index * -15;
    }
  }

  const controlPointX = (sourceX + targetX) / 2 + incrementor;
  const controlPointY = (sourceY + targetY) / 2 + incrementor;

  return [
    `M ${sourceX},${sourceY} Q ${controlPointX},${controlPointY} ${targetX},${targetY}`,
    labelX,
    labelY,
    offsetX,
    offsetY,
  ];
}

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
  data,
}: EdgeProps<MyEdge["data"]>) {
  const [edgePath, labelX, labelY] = getCurvedPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    something: data?.something,
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

  const tokenListEntry = getTokenListEntry(token.id as Address);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          strokeWidth: 4,
          stroke: tokenColor ? tokenColor : undefined,
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
            <div className="flex flex-row items-center gap-1">
              {tokenListEntry?.logoURI && (
                <img
                  alt={`${token.symbol} icon`}
                  src={tokenListEntry?.logoURI}
                  className="h-5 w-5 object-contain"
                ></img>
              )}
              <span>{flowRatePerDayString}</span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
