import { AllRelevantEntitiesQuery } from "subgraph";
import { Address, getAddress } from "viem";
import { Node, Edge } from "reactflow";
import { Label } from "@dagrejs/dagre";
import { groupBy, uniqBy } from "lodash";
import { shortenHex } from "./lib/shortenHex";
import { fromUnixTime } from "date-fns";

export type MyNode = Node<{
  chain?: number;
  address: Address;
  isPool?: boolean;
  isSelected?: boolean;
  label: string;
  isSuperApp?: boolean;
  createdAtBlockNumber: number;
  createdAtTimestamp: number;
  updatedAtBlockNumber: number;
  updatedAtTimestamp: number;
}> &
  Label;

export type PartialNode = {
  id: string;
  data: Partial<MyNode["data"]> &
    Pick<
      MyNode,
      | "createdAtBlockNumber"
      | "createdAtTimestamp"
      | "updatedAtBlockNumber"
      | "updatedAtTimestamp"
    >;
};

export type MyEdge = Edge<{
  flowRate: bigint;
  token: {
    id: string;
    symbol: string;
  };
}>;

export type MyMappedData = {
  nodes: MyNode[];
  edges: MyEdge[];
  latestBlock?: {
    number: number;
    timestamp: Date;
  };
};

export const dataMapper = (
  chain: number,
  data: AllRelevantEntitiesQuery, // all data lower-cased
): MyMappedData => {
  return {
    nodes: mapNodes(chain, data),
    edges: mapEdges(data),
    latestBlock: {
      number: Number(data._meta!.block.number),
      timestamp: fromUnixTime(data._meta!.block.timestamp!),
    },
  };
};

function mapNodes(chain: number, data: AllRelevantEntitiesQuery): MyNode[] {
  const nodesFromAccounts: PartialNode[] = data.accounts.map((x) => ({
    id: x.id,
    data: {
      isSuperApp: x.isSuperApp,
      createdAtBlockNumber: Number(x.createdAtBlockNumber),
      createdAtTimestamp: Number(x.createdAtTimestamp),
      updatedAtBlockNumber: Number(x.updatedAtBlockNumber),
      updatedAtTimestamp: Number(x.updatedAtTimestamp),
      isSelected: true,
    },
  }));

  const nodesFromPoolMembers: PartialNode[] = data.poolMembers
    .map((x) => [
      {
        id: x.pool.id,
        data: {
          isPool: true,
          createdAtBlockNumber: Number(x.pool.createdAtBlockNumber),
          createdAtTimestamp: Number(x.pool.createdAtTimestamp),
          updatedAtBlockNumber: Number(x.pool.updatedAtBlockNumber),
          updatedAtTimestamp: Number(x.pool.updatedAtTimestamp),
        },
      },
      {
        id: x.account.id,
        data: {
          isSuperApp: x.account.isSuperApp,
          createdAtBlockNumber: Number(x.createdAtBlockNumber),
          createdAtTimestamp: Number(x.createdAtTimestamp),
          updatedAtBlockNumber: Number(x.updatedAtBlockNumber),
          updatedAtTimestamp: Number(x.updatedAtTimestamp),
        },
      },
    ])
    .flat();

  const nodesFromPoolDistributors: PartialNode[] = data.poolDistributors
    .map((x) => [
      {
        id: x.pool.id,
        data: {
          isPool: true,
          createdAtBlockNumber: Number(x.pool.createdAtBlockNumber),
          createdAtTimestamp: Number(x.pool.createdAtTimestamp),
          updatedAtBlockNumber: Number(x.pool.updatedAtBlockNumber),
          updatedAtTimestamp: Number(x.pool.updatedAtTimestamp),
        },
      },
      {
        id: x.account.id,
        data: {
          isSuperApp: x.account.isSuperApp,
          createdAtBlockNumber: Number(x.createdAtBlockNumber), // use the pool distributor's
          createdAtTimestamp: Number(x.createdAtTimestamp),
          updatedAtBlockNumber: Number(x.updatedAtBlockNumber),
          updatedAtTimestamp: Number(x.updatedAtTimestamp),
        },
      },
    ])
    .flat();

  const nodesFromStreams: PartialNode[] = data.streams
    .map((x) => [
      {
        id: x.receiver.id,
        data: {
          isSuperApp: x.receiver.isSuperApp,
          createdAtBlockNumber: Number(x.createdAtBlockNumber),
          createdAtTimestamp: Number(x.createdAtTimestamp),
          updatedAtBlockNumber: Number(x.updatedAtBlockNumber),
          updatedAtTimestamp: Number(x.updatedAtTimestamp),
        },
      },
      {
        id: x.sender.id,
        data: {
          isSuperApp: x.sender.isSuperApp,
          createdAtBlockNumber: Number(x.createdAtBlockNumber),
          createdAtTimestamp: Number(x.createdAtTimestamp),
          updatedAtBlockNumber: Number(x.updatedAtBlockNumber),
          updatedAtTimestamp: Number(x.updatedAtTimestamp),
        },
      },
    ])
    .flat();

  const nodesButRedundant: PartialNode[] = [
    ...nodesFromAccounts,
    ...nodesFromPoolMembers,
    ...nodesFromPoolDistributors,
    ...nodesFromStreams,
  ];

  const uniqMergedNodes = Object.entries(
    groupBy(nodesButRedundant, (x) => x.id),
  ).map(([, nodeFromDifferentSources]) => {
    const root = nodeFromDifferentSources[0];
    if (nodeFromDifferentSources.length === 1) {
      return root;
    }

    return {
      ...root,
      data: {
        ...root.data,
        isPool: nodeFromDifferentSources.some((x) => x.data.isPool),
        isSuperApp: nodeFromDifferentSources.some((x) => x.data.isSuperApp),
        isSelected: nodeFromDifferentSources.reduce(
          (acc, curr) => acc || Boolean(curr.data.isSelected),
          false,
        ),
        createdAtBlockNumber: Math.min(
          ...nodeFromDifferentSources.map((x) => x.data.createdAtBlockNumber),
        ),
        createdAtTimestamp: Math.min(
          ...nodeFromDifferentSources.map((x) => x.data.createdAtTimestamp),
        ),
        updatedAtBlockNumber: Math.max(
          ...nodeFromDifferentSources.map((x) => x.data.updatedAtBlockNumber),
        ),
        updatedAtTimestamp: Math.max(
          ...nodeFromDifferentSources.map((x) => x.data.updatedAtTimestamp),
        ),
      },
    };
  });

  const nodesWithFullData: MyNode[] = uniqMergedNodes.map((node) => {
    const address = getAddress(node.id);
    return {
      ...node,
      data: {
        ...node.data,
        chain,
        address,
        label: shortenHex(address),
      },
      type: "custom",
      position: { x: 0, y: 0 },
    };
  });

  return nodesWithFullData;
}

function mapEdges(data: AllRelevantEntitiesQuery): MyEdge[] {
  const edgesFromPoolDistributors: MyEdge[] = data.poolDistributors
    .map((x) => [
      {
        id: `${x.pool.token.id}-${x.account.id}-${x.pool.id}`,
        source: x.account.id,
        target: x.pool.id,
        data: {
          token: {
            id: x.pool.token.id,
            symbol: x.pool.token.symbol,
          },
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
          token: {
            id: x.pool.token.id,
            symbol: x.pool.token.symbol,
          },
          flowRate:
            BigInt(x.units) > 0
              ? (BigInt(x.pool.flowRate) * BigInt(x.pool.totalUnits)) /
                BigInt(x.units)
              : 0n,
        },
      },
      // ...x.pool.poolDistributors.map((y) => ({
      //   id: `${x.pool.token.id}-${y.account.id}-${x.pool.id}`,
      //   source: y.account.id,
      //   target: x.pool.id,
      //   data: {
      //     flowRate: BigInt(y.flowRate),
      //   },
      // })),
    ])
    .flat();

  const edgesFromStreams: MyEdge[] = data.streams
    .map((x) => [
      {
        id: `${x.token.id}-${x.sender.id}-${x.receiver.id}`,
        source: x.sender.id,
        target: x.receiver.id,
        data: {
          token: {
            id: x.token.id,
            symbol: x.token.symbol,
          },
          flowRate: BigInt(x.currentFlowRate),
        },
      },
    ])
    .flat();

  const edgesButRedundant: MyEdge[] = [
    ...edgesFromPoolMembers,
    ...edgesFromStreams,
    ...edgesFromPoolDistributors,
  ];

  const uniqEdges: MyEdge[] = Object.entries(
    groupBy(edgesButRedundant, (x) => x.id),
  ).map(([, edgesFromDifferentSources]) => {
    const root = edgesFromDifferentSources[0];
    if (edgesFromDifferentSources.length === 1) {
      return root;
    }

    return {
      ...root,
      data: {
        ...root.data!,
        flowRate: edgesFromDifferentSources.reduce(
          (acc, x) => acc + BigInt(x.data?.flowRate ?? 0),
          0n,
        ),
      },
    };
  });

  const edgesWithFullData = uniqEdges.map((x) => ({
    ...x,
    animated: true,
    type: "floating",
  }));

  return edgesWithFullData;
}
