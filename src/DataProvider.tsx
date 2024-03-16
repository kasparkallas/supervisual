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
import { DiagramInput } from "./diagramInputSchema";
import { Button } from "./components/ui/button";
import { DataForm } from "./DataForm";
import { groupBy, memoize, uniqBy } from "lodash";
import { shortenHex } from "./lib/shortenHex";
import { Address, getAddress } from "viem";
import sfMeta from "@superfluid-finance/metadata";

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

  const results = data
    ? (() => {
        const { nodes, edges } = dataMapper(chain, accounts, data);

        return {
          nodes,
          edges,
        };
      })()
    : undefined;

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
