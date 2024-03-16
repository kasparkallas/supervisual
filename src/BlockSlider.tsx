import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Slider } from "./components/ui/slider";
import sfMeta from "@superfluid-finance/metadata";
import { useQuery } from "@tanstack/react-query";
import { graphSDK } from "./DataProvider";
import { MyNode } from "./dataMapper";
import { useEffect, useMemo, useState } from "react";
import { maxBy, minBy } from "lodash";
import { cn } from "./lib/utils";

const route = getRouteApi("/");

type Props = {
  // chain: number;
  block: number | null;
  nodes: MyNode[];
};

export function BlockSlider({ block, nodes }: Props) {
  const navigate = useNavigate();
  const search = route.useSearch();

  // const metadata = sfMeta.getNetworkByChainId(chain)!;

  // const { data } = useQuery({
  //     queryKey: ["chain", chain],
  //     queryFn: () =>
  //         graphSDK(chain).CurrentBlock(),
  // });

  const { min, max, averageBlockTime } = useMemo(() => {
    if (!nodes.length) {
      return { min: 0, max: 0, averageBlockTime: 0 };
    }

    const earliestNode = minBy(nodes, (x) => x.data.createdAtBlockNumber)!;
    const latestNode = maxBy(nodes, (x) => x.data.updatedAtBlockNumber)!;

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

  // if (!data) {
  //     return null;
  // }

  // todo: handle wierd case where the input block is outside the range
  const defaultValue = block ? Math.min(block ?? max) : max;
  // const max = data._meta!.block.number;
  // const min = metadata.startBlockV1;

  const [pendingValue, setPendingValue] = useState<number | undefined>(
    undefined,
  );
  const visibleValue = pendingValue ?? defaultValue;

  const timeAgo = (defaultValue - visibleValue) * averageBlockTime;

  return (
    <div
      className={cn(
        "flex min-w-96 items-center gap-3",
        averageBlockTime === 0 ? "invisible" : "",
      )}
    >
      <Slider
        key={`${min}-${max}`}
        className="w-3/4"
        min={min}
        max={max}
        defaultValue={[defaultValue]}
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
      <p className="w-1/4 text-sm">
        {visibleValue === max ? "Latest" : visibleValue}
        <span
          className={cn(
            "ml-1 text-xs",
            visibleValue === defaultValue ? "invisibile" : "",
          )}
        >
          {visibleValue !== defaultValue
            ? `(~${timeAgo > 0 ? `${timeAgo} seconds ago` : `${Math.abs(timeAgo)} seconds later`})`
            : ""}
        </span>
      </p>
    </div>
  );
}
