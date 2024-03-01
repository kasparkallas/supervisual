import { useQuery } from "@tanstack/react-query";

import { getBuiltGraphSDK, AllRelevantEntitiesQuery } from "subgraph";

import Diagram from "./Diagram";
import { Input } from "./routes";
import { MarkerType, ReactFlowProvider } from "reactflow";
import { Address } from "viem";
import { Node, Edge } from "reactflow";
import { uniqBy } from "lodash";

const sdk = getBuiltGraphSDK({
  url: "https://polygon-mumbai.subgraph.x.superfluid.dev/",
});

type Props = Input;

function DiagramProvider({ account, token }: Props) {
  const result = useQuery({
    // todo, query key based on account and token
    queryKey: [account, token],
    queryFn: () =>
      sdk.AllRelevantEntities({
        account: account,
        token: token,
      }),
    select: (data) => mapper(account, data),
  });

  // TODO: null coalesching
  return (
    <ReactFlowProvider>
      {result.data && (
        <Diagram nodes={result.data.nodes} edges={result.data.edges} />
      )}
    </ReactFlowProvider>
  );
}

export default DiagramProvider;

// # Utils
const mapper = (accountAddress: Address, data: AllRelevantEntitiesQuery) => {
  const nodesFromPoolMembers: Node[] = data.poolMembers
    .map((x) => [
      {
        id: x.pool.id,
        data: {
          label: shortenHex(x.pool.id),
          width: 100,
          height: 100,
          pool: true,
        },
        style: {
          backgroundColor: "orange",
        },
        position: { x: 0, y: 0 },
      } as Node,
      ...x.pool.poolDistributors.map(
        (y) =>
          ({
            id: y.account.id,
            data: { label: shortenHex(y.account.id), width: 100, height: 100 },
            position: { x: 0, y: 0 },
            style: {
              backgroundColor: "yellow",
            },
          }) as Node,
      ),
    ])
    .flat();

  const nodesFromPoolDistributors: Node[] = data.poolDistributors.map(
    (x) =>
      ({
        id: x.pool.id,
        data: { label: shortenHex(x.pool.id), width: 100, height: 100 },
        style: {
          backgroundColor: "yellow",
        },
        position: { x: 0, y: 0 },
      }) as Node,
  );

  const nodesFromStreams: Node[] = data.streams
    .map((x) => [
      {
        id: x.receiver.id,
        data: { label: shortenHex(x.receiver.id), width: 100, height: 100 },
        position: { x: 0, y: 0 },
      } as Node,
      {
        id: x.sender.id,
        data: { label: shortenHex(x.sender.id), width: 100, height: 100 },
        position: { x: 0, y: 0 },
      } as Node,
    ])
    .flat();

  const nodes: Node[] = uniqBy(
    [
      {
        id: accountAddress,
        data: { label: shortenHex(accountAddress), width: 100, height: 100 },
        position: { x: 0, y: 0 },
      } as Node,
      ...nodesFromPoolMembers,
      ...nodesFromPoolDistributors,
      ...nodesFromStreams,
    ],
    (x) => x.id,
  );

  const edgesFromPoolDistributors: Edge[] = data.poolDistributors
    .map((x) => [
      {
        id: `${accountAddress}-${x.pool.id}`,
        source: accountAddress,
        target: x.pool.id,
        animated: true,
        style: {
          strokeWidth: 5,
        },
        markerEnd: {
          type: MarkerType.Arrow,
        },
        type: "floating",
      } as Edge,
    ])
    .flat();

  const edgesFromPoolMembers: Edge[] = data.poolMembers
    .map((x) => [
      {
        id: `${x.pool.id}-${accountAddress}`,
        source: x.pool.id,
        target: accountAddress,
        animated: true,
        style: {
          strokeWidth: 5,
        },
        markerEnd: {
          type: MarkerType.Arrow,
        },
        type: "floating",
      } as Edge,
      ...x.pool.poolDistributors.map(
        (y) =>
          ({
            id: `${y.account.id}-${x.pool.id}`,
            source: y.account.id,
            target: x.pool.id,
            animated: true,
            style: {
              strokeWidth: 5,
            },
            markerEnd: {
              type: MarkerType.Arrow,
            },
            type: "floating",
          }) as Edge,
      ),
    ])
    .flat();

  const edgesFromStreams: Edge[] = data.streams
    .map((x) => [
      {
        id: `${x.sender.id}-${x.receiver.id}`,
        source: x.sender.id,
        target: x.receiver.id,
        animated: true,
        style: {
          strokeWidth: 5,
        },
        markerEnd: {
          type: MarkerType.Arrow,
        },
        type: "floating",
      } as Edge,
    ])
    .flat();

  const edges: Edge[] = uniqBy(
    [
      ...edgesFromPoolMembers,
      ...edgesFromStreams,
      ...edgesFromPoolDistributors,
    ],
    (x) => x.id,
  );

  // scale flow rates

  return { nodes, edges };
};

export function shortenHex(address: string, chars = 4) {
  return (
    address.slice(0, chars + 2) +
    "..." +
    address.slice(address.length - chars, address.length)
  );
}
