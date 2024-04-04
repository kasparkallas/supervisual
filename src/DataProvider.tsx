import { getBuiltGraphSDK } from "subgraph";

import Diagram from "./Diagram";
import { Panel, ReactFlowProvider } from "reactflow";
import { MyMappedData, dataMapper } from "./dataMapper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DiagramInput } from "./diagramInputSchema";
import { Button } from "./components/ui/button";
import { DataForm } from "./DataForm";
import { memoize } from "lodash";
import sfMeta from "@superfluid-finance/metadata";
import { BlockSlider } from "./BlockSlider";
import { useId, useMemo, useState } from "react";

export const graphSDK = memoize((chain: number) => {
  const metadata = sfMeta.getNetworkByChainId(chain);
  if (!metadata) {
    throw new Error("Unsupported chain");
  }
  return getBuiltGraphSDK({
    url: `https://${metadata.name}.subgraph.x.superfluid.dev/`,
  });
});

type Props = DiagramInput;

function DataProvider({ chain, tokens, accounts, block }: Props) {
  const hasEnoughInput = Boolean(accounts.length) && Boolean(tokens.length);

  const { data, isPlaceholderData: _isPlaceholderData } = useQuery({
    queryKey: [
      "chain",
      chain,
      "tokens",
      ...tokens,
      "accounts",
      ...accounts,
      "block",
      block,
    ],
    queryFn: () =>
      graphSDK(chain).AllRelevantEntities({
        block: block ? { number: block } : null,
        accounts: accounts,
        accounts_bytes: accounts,
        tokens: tokens,
      }),
    enabled: hasEnoughInput,
    placeholderData: keepPreviousData,
  });

  const mappedData: MyMappedData = useMemo(() => {
    if (data) {
      return dataMapper(chain, accounts, data);
    } else {
      return {
        nodes: [],
        edges: [],
      };
    }
  }, [data]);

  // console.log({ data, results, block })

  // todo: handle loading better

  const key = useMemo(() => Date.now(), [data]);

  const [open, setOpen] = useState(false);

  return (
    <>
      <Panel position="top-left" className="flex items-center gap-6">
        {/* <div className="flex items-center gap-6"> */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="scale-95 rounded-full shadow-lg shadow-neutral-400 transition-transform hover:scale-100">
              Configure Selection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Configure Selection</DialogTitle>
              <DialogDescription>
                The network, tokens and accounts you select will be used for the
                diagram.
              </DialogDescription>
            </DialogHeader>
            <DataForm onSubmit={() => setOpen(false)} />
          </DialogContent>
        </Dialog>

        {/* </div> */}
      </Panel>
      <Panel position="bottom-center">
        <BlockSlider block={block} {...mappedData} />
      </Panel>
      <Diagram key={key} nodes={mappedData.nodes} edges={mappedData.edges} />
    </>
  );
}

export default DataProvider;
