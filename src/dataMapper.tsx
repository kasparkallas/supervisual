import { AllRelevantEntitiesQuery } from "subgraph";
import { Address } from "viem";
import { Node, Edge } from "reactflow";
import { uniqBy } from "lodash";
import { shortenHex } from "./lib/shortenHex";
import { Label } from "@dagrejs/dagre";

export type MyNode = Omit<
  Node<{
    address: string;
    isPool?: boolean;
    label?: string; // todo: move this
  }>,
  "position"
> &
  Label;
export type MyEdge = Edge;

export const dataMapper = (
  // accountAddress: Address,
  data: AllRelevantEntitiesQuery,
) => {
  const nodesFromPoolMembers: MyNode[] = data.poolMembers
    .map((x) => [
      {
        id: x.pool.id,
        data: {
          address: x.pool.id,
          isPool: true,
        },
      },
      ...x.pool.poolDistributors.map((y) => ({
        id: y.account.id,
        data: { address: y.account.id },
      })),
    ])
    .flat();

  const nodesFromPoolDistributors: MyNode[] = data.poolDistributors.map(
    (x) => ({
      id: x.pool.id,
      data: { address: x.pool.id, isPool: true },
    }),
  );

  const nodesFromStreams: MyNode[] = data.streams
    .map((x) => [
      {
        id: x.receiver.id,
        data: { address: x.receiver.id },
      },
      {
        id: x.sender.id,
        data: { address: x.sender.id },
      },
    ])
    .flat();

  const nodes: MyNode[] = uniqBy(
    [
      ...nodesFromPoolMembers,
      ...nodesFromPoolDistributors,
      ...nodesFromStreams,
    ],
    (x) => x.id,
  );

  const edgesFromPoolDistributors: MyEdge[] = data.poolDistributors
    .map((x) => [
      {
        id: `${x.account.id}-${x.pool.id}`,
        source: x.account.id,
        target: x.pool.id,
      },
    ])
    .flat();

  const edgesFromPoolMembers: MyEdge[] = data.poolMembers
    .map((x) => [
      {
        id: `${x.pool.id}-${x.account.id}`,
        source: x.pool.id,
        target: x.account.id,
      },
      ...x.pool.poolDistributors.map((y) => ({
        id: `${y.account.id}-${x.pool.id}`,
        source: y.account.id,
        target: x.pool.id,
      })),
    ])
    .flat();

  const edgesFromStreams: MyEdge[] = data.streams
    .map((x) => [
      {
        id: `${x.sender.id}-${x.receiver.id}`,
        source: x.sender.id,
        target: x.receiver.id,
      },
    ])
    .flat();

  const edges: MyEdge[] = uniqBy(
    [
      ...edgesFromPoolMembers,
      ...edgesFromStreams,
      ...edgesFromPoolDistributors,
    ],
    (x) => x.id,
  );

  return { nodes, edges };
};
