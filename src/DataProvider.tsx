import { getBuiltGraphSDK } from "subgraph";

import Diagram from "./Diagram";
import { MarkerType, Panel, ReactFlowProvider } from "reactflow";
import { MyNode, dataMapper } from "./dataMapper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useQuery } from "@tanstack/react-query";
import { DiagramInput } from "./userInputSchema";
import { Button } from "./components/ui/button";
import { DataForm } from "./DataForm";
import { groupBy, memoize, uniqBy } from "lodash";
import { shortenHex } from "./lib/shortenHex";
import { Address, getAddress } from "viem";
import sfMeta from "@superfluid-finance/metadata";
import { deepmerge } from "@fastify/deepmerge";
import { mergeDeep } from "./mergeDeep";

// const deepmerger = deepmerge({
//   all: true
// });

const graphSDK = memoize((chain: number) => {
  const metadata = sfMeta.getNetworkByChainId(chain);
  if (!metadata) {
    throw new Error("Unsupported chain");
  }
  return getBuiltGraphSDK({
    url: `https://${metadata.name}.subgraph.x.superfluid.dev/`,
  });
});

type Props = DiagramInput;

function DataProvider({ chain, tokens, accounts }: Props) {
  const hasEnoughInput = Boolean(accounts.length) && Boolean(tokens.length);
  const { data } = useQuery({
    queryKey: ["chain", chain, "tokens", ...tokens, "accounts", ...accounts],
    queryFn: () =>
      graphSDK(chain).AllRelevantEntities({
        accounts: accounts,
        tokens: tokens,
      }),
    enabled: hasEnoughInput,
  });

  // const queryResults = useQueries({
  //   queries: hasEnoughInput
  //     ? accounts.map((account) => ({
  //       queryKey: [account, token],
  //       queryFn: () =>
  //         graphSDK.AllRelevantEntities({
  //           account: account,
  //           token: token,
  //         }),
  //     }))
  //     : [],
  // });

  // console.log(queryResults);

  // todo: clean-up
  const results = data
    ? (() => {
        const { nodes, edges } = dataMapper(accounts, data);

        const uniqNodes = Object.entries(groupBy(nodes, (x) => x.id)).map(
          (x) => {
            return {
              ...x[1][0],
              data: {
                ...x[1][0].data,
                isPool: x[1].some((y) => y.data.isPool),
                isSuperApp: x[1].some((y) => y.data.isSuperApp),
              },
            };
          },
        );

        // uniqBy(nodes, (x) => x.id);
        const uniqEdges = uniqBy(edges, (x) => x.id); // todo: should sum the flow rates

        return {
          nodes: uniqNodes.map((node) => {
            const isSelected = accounts
              .map((x) => x.toLowerCase())
              .includes(node.data.address.toLowerCase() as Address);
            return {
              ...node,
              data: {
                ...node.data,
                isSelected,
                chain,
                label: shortenHex(node.data.address),
              },
              type: "custom",
              position: { x: 0, y: 0 },
            };
          }),
          edges: uniqEdges.map((x) => ({
            ...x,
            animated: uniqEdges.length < 75,
            type: "floating",
            style: {
              strokeWidth: 3,
            },
            // markerEnd: {
            //   type: MarkerType.Arrow,
            //   width: 20,
            //   height: 20,
            // }
          })),
        };
      })()
    : undefined;

  // !queryResults.some((x) => !x.data)
  //   ? queryResults
  //     .map((x) => x.data)
  //     .flat()
  //     .map((x) => dataMapper(accounts[0], x!))
  //     .reduce(
  //       (acc, curr) => {
  //         return {
  //           nodes: uniqBy([...acc.nodes, ...curr.nodes], (x) => x.id),
  //           edges: uniqBy([...acc.edges, ...curr.edges], (x) => x.id),
  //         };
  //       },
  //       { nodes: [], edges: [] },
  //     )
  //   : undefined;

  // todo: handle loading better

  return (
    <ReactFlowProvider>
      <Panel position="top-left">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="scale-95 rounded-full shadow-lg shadow-neutral-400 transition-transform hover:scale-100">
              Configure Selection
            </Button>
          </DialogTrigger>
          <FormDialogContent />
        </Dialog>
      </Panel>
      {results && <Diagram nodes={results.nodes} edges={results.edges} />}
    </ReactFlowProvider>
  );
}

export default DataProvider;

const FormDialogContent = () => {
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Configure Selection</DialogTitle>
        <DialogDescription>
          The network, tokens and accounts you select will be used for the
          diagram.
        </DialogDescription>
      </DialogHeader>
      <DataForm />
    </DialogContent>
  );
};
