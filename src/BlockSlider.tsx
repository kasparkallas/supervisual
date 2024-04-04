import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Slider } from "./components/ui/slider";
import sfMeta from "@superfluid-finance/metadata";
import { useQuery } from "@tanstack/react-query";
import { graphSDK } from "./DataProvider";
import { MyMappedData, MyNode } from "./dataMapper";
import { useEffect, useMemo, useState } from "react";
import { maxBy, minBy } from "lodash";
import { cn } from "./lib/utils";
import {
  format,
  formatDuration,
  fromUnixTime,
  intervalToDuration,
} from "date-fns";

const route = getRouteApi("/");

type Props = {
  block: number | null;
} & MyMappedData;

export function BlockSlider({ block, nodes, latestBlock }: Props) {
  const navigate = useNavigate();
  const search = route.useSearch();

  const { min, max, averageBlockTime } = useMemo(() => {
    const selectedNodes = nodes.filter((x) => x.data.isSelected);
    if (!selectedNodes.length) {
      return { min: 0, max: 0, averageBlockTime: 0 };
    }

    const earliestNode = minBy(
      selectedNodes,
      (x) => x.data.createdAtBlockNumber,
    )!;

    const latestNode = maxBy(
      selectedNodes,
      (x) => x.data.updatedAtBlockNumber,
    )!;

    const min = earliestNode.data.createdAtBlockNumber;
    const max = latestNode.data.updatedAtBlockNumber;

    const elapsedTime =
      latestNode.data.updatedAtTimestamp - earliestNode.data.createdAtTimestamp;
    const elapsedBlocks =
      latestNode.data.updatedAtBlockNumber -
      earliestNode.data.createdAtBlockNumber;

    const averageBlockTime =
      elapsedBlocks > 0 ? elapsedTime / elapsedBlocks : 0;

    return { min, max, averageBlockTime };
  }, [nodes, block]);

  // todo: handle wierd case where the input block is outside the range
  const defaultBlock = block ? Math.min(block ?? max) : max;

  const [pendingBlock, setPendingValue] = useState<number | undefined>(
    undefined,
  );
  const visibleBlock = pendingBlock ?? defaultBlock;

  const timeAgo = (defaultBlock - visibleBlock) * averageBlockTime;

  // const isNon
  // const queryDate = useMemo(() => {
  //     if (latestBlock?.number) {
  //         return fromUnixTime(meta.block.timestamp);
  //     }
  // }, [latestBlock]);

  const timeAgoText = useMemo(() => {
    const durationFormatted = formatDuration(
      intervalToDuration({ start: 0, end: Math.abs(timeAgo * 1000) }),
      {
        zero: false,
        format: ["years", "months", "days", "hours"],
      },
    );
    return `${durationFormatted}`;
  }, [timeAgo]);

  return (
    <div
      className={cn(
        "flex min-w-96 flex-col gap-3",
        averageBlockTime === 0 ? "invisible" : "",
      )}
    >
      <p className="w-max text-sm">
        {visibleBlock === max
          ? `Block ${visibleBlock} (latest)`
          : `Block ${visibleBlock}`}
        <span
          className={cn(
            "ml-1 text-xs",
            visibleBlock === defaultBlock ? "invisibile" : "",
          )}
        >
          {/* {formatDuration(intervalToDuration({ end: 0, start: timeAgo * 1000 }), {
                        zero: false,
                        format: ["years", "months", "days", "hours"],
                    })} */}

          {/* {
                        format(queryDate, "yyyy-MM-dd HH:mm:ss")
                    } */}

          {/* {visibleValue !== defaultValue
                        ? `(~${timeAgo > 0 ? `${timeAgo} seconds ago` : `${Math.abs(timeAgo)} seconds later`})`
                        : ""} */}
        </span>
      </p>
      <Slider
        key={`${min}-${max}`}
        min={min}
        max={max}
        defaultValue={[defaultBlock]}
        step={1}
        onValueChange={([value]) => setPendingValue(value)}
        onValueCommit={([newValue]) => {
          const isLatestValue = newValue === max;
          const { block, ...previousSearch } = search;

          const newSearch = {
            ...previousSearch,
            ...(isLatestValue ? { block: null } : { block: newValue }),
          } as const;

          navigate({
            search: newSearch,
          });

          setPendingValue(undefined);
        }}
      />
    </div>
  );
}
