import { AllRelevantEntitiesQuery } from "subgraph";
import { Address, getAddress } from "viem";
import { Node, Edge } from "reactflow";
import { uniqBy } from "lodash";
import { shortenHex } from "./lib/shortenHex";
import { Label } from "@dagrejs/dagre";

export type MyNode = Omit<
  Node<{
    chain?: number; // todo: clean-up
    address: Address;
    isPool?: boolean;
    isSelected?: boolean;
    label?: string; // todo: move this
    isSuperApp?: boolean;
  }>,
  "position"
> &
  Label;
export type MyEdge = Edge<{
  flowRate: bigint;
}>;

export const dataMapper = (
  // accountAddress: Address,
  data: AllRelevantEntitiesQuery,
) => {
  const nodesFromPoolMembers: MyNode[] = data.poolMembers
    .map((x) => [
      {
        id: x.pool.id,
        data: {
          address: getAddress(x.pool.id),
          isPool: true,
        },
      },
      ...x.pool.poolDistributors.map((y) => ({
        id: y.account.id,
        data: {
          address: getAddress(y.account.id),
          isSuperApp: x.account.isSuperApp,
        },
      })),
    ])
    .flat();

  const nodesFromPoolDistributors: MyNode[] = data.poolDistributors
    .map((x) => [
      {
        id: x.pool.id,
        data: {
          address: getAddress(x.pool.id),
          isPool: true,
        },
      },
      {
        id: x.account.id,
        data: {
          address: getAddress(x.account.id),
          isSuperApp: x.account.isSuperApp,
        },
      },
    ])
    .flat();

  const nodesFromStreams: MyNode[] = data.streams
    .map((x) => [
      {
        id: x.receiver.id,
        data: {
          address: getAddress(x.receiver.id),
          isSuperApp: x.receiver.isSuperApp,
        },
      },
      {
        id: x.sender.id,
        data: {
          address: getAddress(x.sender.id),
          isSuperApp: x.sender.isSuperApp,
        },
      },
    ])
    .flat();

  const nodes: MyNode[] = [
    ...nodesFromPoolMembers,
    ...nodesFromPoolDistributors,
    ...nodesFromStreams,
  ];

  const edgesFromPoolDistributors: MyEdge[] = data.poolDistributors
    .map((x) => [
      {
        id: `${x.pool.token.id}-${x.account.id}-${x.pool.id}`,
        source: x.account.id,
        target: x.pool.id,
        data: {
          flowRate: BigInt(x.flowRate),
        },
      },
    ])
    .flat();

  const edgesFromPoolMembers: MyEdge[] = data.poolMembers
    .map((x) => [
      {
        id: `${x.pool.token.id}-${x.pool.id}-${x.account.id}`,
        source: x.pool.id,
        target: x.account.id,
        data: {
          flowRate:
            BigInt(x.units) > 0
              ? (BigInt(x.pool.flowRate) * BigInt(x.pool.totalUnits)) /
                BigInt(x.units)
              : 0n,
        },
      },
      ...x.pool.poolDistributors.map((y) => ({
        id: `${x.pool.token.id}-${y.account.id}-${x.pool.id}`,
        source: y.account.id,
        target: x.pool.id,
        data: {
          flowRate: BigInt(y.flowRate),
        },
      })),
    ])
    .flat();

  const edgesFromStreams: MyEdge[] = data.streams
    .map((x) => [
      {
        id: `${x.token.id}-${x.sender.id}-${x.receiver.id}`,
        source: x.sender.id,
        target: x.receiver.id,
        data: {
          flowRate: BigInt(x.currentFlowRate),
        },
      },
    ])
    .flat();

  const edges: MyEdge[] = [
    ...edgesFromPoolMembers,
    ...edgesFromStreams,
    ...edgesFromPoolDistributors,
  ];

  return { nodes, edges };
};
